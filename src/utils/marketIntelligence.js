/**
 * SmartVet Africa — Market Intelligence Engine
 *
 * Predicts supply availability risk using four signals:
 *   1. Exponentially-weighted availability history (recent checks count more)
 *   2. Price trend analysis (price rises often precede shortages)
 *   3. Staleness penalty (old data → regress score toward 0.5 = uncertainty)
 *   4. Cross-supplier systemic shortage detection
 *
 * All functions are pure (no side-effects), enabling use in useMemo.
 */

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_SCORE    = { in_stock: 1.0, low_stock: 0.4, out_of_stock: 0.0 };
const HALFLIFE_DAYS   = 21;    // check 21 days old = ~37% weight of today's check
const STALE_MULTIPLIER = 3;    // stale = daysSinceCheck > leadTime × STALE_MULTIPLIER
const TREND_THRESHOLD  = 0.15; // min score delta to call a trend improving/worsening

// ── Risk-level metadata ───────────────────────────────────────────────────────
export const RISK_META = {
  critical: { label: 'Critical', emoji: '🔴', bg: 'bg-red-50',    text: 'text-red-800',    border: 'border-red-300',    badge: 'bg-red-100 text-red-800' },
  at_risk:  { label: 'At Risk',  emoji: '🟠', bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-300', badge: 'bg-orange-100 text-orange-800' },
  monitor:  { label: 'Monitor',  emoji: '🟡', bg: 'bg-amber-50',  text: 'text-amber-800',  border: 'border-amber-300',  badge: 'bg-amber-100 text-amber-800' },
  stable:   { label: 'Stable',   emoji: '🟢', bg: 'bg-green-50',  text: 'text-green-800',  border: 'border-green-300',  badge: 'bg-green-100 text-green-800' },
  unknown:  { label: 'No Data',  emoji: '⚪', bg: 'bg-gray-50',   text: 'text-gray-500',   border: 'border-gray-200',   badge: 'bg-gray-100 text-gray-500' },
};

const LEVEL_ORDER = { critical: 0, at_risk: 1, monitor: 2, stable: 3, unknown: 4 };

function scoreToLevel(score) {
  if (score === null || score === undefined) return 'unknown';
  if (score >= 0.75) return 'stable';
  if (score >= 0.50) return 'monitor';
  if (score >= 0.25) return 'at_risk';
  return 'critical';
}

// ── 1. Availability Score ─────────────────────────────────────────────────────
/**
 * Compute an exponentially-weighted availability score (0–1) for one product
 * at one supplier, using the full availabilityLog.
 *
 * Returns null when there are no check records at all.
 */
export function calcAvailabilityScore(availabilityLog, supplierName, productId) {
  const now = Date.now();
  const pts = [];

  for (const entry of availabilityLog) {
    if (entry.supplier !== supplierName) continue;
    for (const chk of (entry.checks || [])) {
      if (chk.productId !== productId) continue;
      const ageDays = (now - new Date(entry.date).getTime()) / 86_400_000;
      const weight  = Math.exp(-ageDays / HALFLIFE_DAYS);
      pts.push({ score: STATUS_SCORE[chk.status] ?? 0, status: chk.status, weight, ageDays, date: entry.date });
    }
  }

  if (!pts.length) return null;

  // Sort newest first (smallest ageDays first)
  pts.sort((a, b) => a.ageDays - b.ageDays);

  const totalW   = pts.reduce((s, p) => s + p.weight, 0);
  const score    = pts.reduce((s, p) => s + p.score * p.weight, 0) / totalW;

  // Trend: compare most-recent half vs older half
  const mid       = Math.ceil(pts.length / 2);
  const recentAvg = pts.slice(0, mid).reduce((s, p) => s + p.score, 0) / mid;
  const olderHalf = pts.slice(mid);
  let trend = 'stable';
  if (olderHalf.length) {
    const olderAvg = olderHalf.reduce((s, p) => s + p.score, 0) / olderHalf.length;
    if (recentAvg - olderAvg > TREND_THRESHOLD)  trend = 'improving';
    else if (olderAvg - recentAvg > TREND_THRESHOLD) trend = 'worsening';
  }

  // Out-of-stock frequency over last 90 days
  const recent90 = pts.filter(p => p.ageDays <= 90);
  const oosRate  = recent90.length
    ? recent90.filter(p => p.status === 'out_of_stock').length / recent90.length
    : 0;

  return {
    score,
    checkCount:      pts.length,
    daysSinceCheck:  pts[0].ageDays,           // most-recent check age
    lastStatus:      pts[0].status,
    lastCheckDate:   pts[0].date,
    trend,                                      // 'improving' | 'stable' | 'worsening'
    oosRate,                                    // 0–1 fraction of OOS checks (last 90d)
  };
}

// ── 2. Price Trend ────────────────────────────────────────────────────────────
/**
 * Returns price trend direction and % change for one product at one supplier.
 */
export function calcPriceTrend(priceLog, supplierName, catalogueId) {
  const entries = [];
  for (const entry of priceLog) {
    if (entry.supplier !== supplierName) continue;
    for (const item of (entry.items || [])) {
      if (item.catalogueId !== catalogueId) continue;
      entries.push({ price: item.unitPrice, date: entry.date });
    }
  }

  if (entries.length < 2) return { trend: 'unknown', pctChange: null, prices: entries };

  entries.sort((a, b) => new Date(a.date) - new Date(b.date));
  const latest   = entries[entries.length - 1].price;
  const previous = entries[entries.length - 2].price;
  const pctChange = previous ? ((latest - previous) / previous) * 100 : 0;

  // Long-run trend (first vs latest)
  const first = entries[0].price;
  const longPctChange = first ? ((latest - first) / first) * 100 : 0;

  return {
    trend:          pctChange > 3 ? 'rising' : pctChange < -3 ? 'falling' : 'stable',
    pctChange:      Math.round(pctChange * 10) / 10,
    longPctChange:  Math.round(longPctChange * 10) / 10,
    latestPrice:    latest,
    previousPrice:  previous,
    prices:         entries,
  };
}

// ── 3. Product Risk Score ─────────────────────────────────────────────────────
/**
 * Combines availability score + price trend into a single risk level.
 * Applies staleness penalty (regresses toward 0.5 as data ages).
 */
export function calcProductRisk(availScore, priceTrend, leadTimeDays = 7) {
  if (!availScore) {
    return { level: 'unknown', score: null, stale: false, stalenessFactor: 0, flags: [] };
  }

  const staleThreshold  = (leadTimeDays || 7) * STALE_MULTIPLIER;
  const stalenessFactor = Math.min(availScore.daysSinceCheck / staleThreshold, 1);
  const isStale         = stalenessFactor > 0.5;

  // Regress score toward 0.5 (maximum uncertainty) as data gets stale
  let adjusted = availScore.score * (1 - stalenessFactor) + 0.5 * stalenessFactor;

  const flags = [];

  if (priceTrend?.trend === 'rising') {
    adjusted -= 0.08;
    flags.push({ code: 'price_rising',   label: `Price up ${priceTrend.pctChange}%`, icon: '📈' });
  }
  if (priceTrend?.trend === 'falling') {
    flags.push({ code: 'price_falling',  label: `Price down ${Math.abs(priceTrend.pctChange)}%`, icon: '📉' });
  }
  if (availScore.trend === 'worsening') {
    adjusted -= 0.12;
    flags.push({ code: 'trend_down',     label: 'Availability declining', icon: '⬇️' });
  }
  if (availScore.trend === 'improving') {
    adjusted += 0.05;
    flags.push({ code: 'trend_up',       label: 'Availability improving', icon: '⬆️' });
  }
  if (availScore.oosRate > 0.3) {
    flags.push({ code: 'frequent_oos',   label: `OOS ${Math.round(availScore.oosRate * 100)}% of recent checks`, icon: '⚠️' });
  }
  if (isStale) {
    flags.push({ code: 'stale',          label: `Last checked ${Math.round(availScore.daysSinceCheck)}d ago`, icon: '🕐' });
  }

  adjusted = Math.max(0, Math.min(1, adjusted));
  return { level: scoreToLevel(adjusted), score: adjusted, stale: isStale, stalenessFactor, flags };
}

// ── 4. 30-Day Forecast ────────────────────────────────────────────────────────
/**
 * Projects the availability score N days forward using the current trend.
 * Returns null when there is insufficient history (< 2 checks).
 */
export function forecastAvailability(availScore, priceTrend, daysAhead = 30) {
  if (!availScore || availScore.checkCount < 2) return null;

  const trendDelta = availScore.trend === 'worsening'  ? -0.08 * (daysAhead / 30)
                   : availScore.trend === 'improving'   ?  0.04 * (daysAhead / 30)
                   : 0;
  const priceDelta = priceTrend?.trend === 'rising' ? -0.05 * (daysAhead / 30) : 0;

  const projected = Math.max(0, Math.min(1, availScore.score + trendDelta + priceDelta));
  const direction = projected > availScore.score + 0.05 ? 'improving'
                  : projected < availScore.score - 0.05 ? 'worsening'
                  : 'stable';

  return { score: projected, level: scoreToLevel(projected), direction, daysAhead };
}

// ── 5. Systemic Shortage Detection ───────────────────────────────────────────
/**
 * Finds products that are simultaneously low/out-of-stock at ≥2 suppliers.
 * These represent market-wide supply shocks, not single-supplier issues.
 */
export function detectSystemicShortages(availabilityLog, suppliers, windowDays = 45) {
  const now = Date.now();
  // productName (normalised) → { displayName, suppliers: [{ supplierName, status, date }] }
  const byProduct = {};

  for (const [supplierName, details] of Object.entries(suppliers)) {
    for (const item of (details.catalogue || [])) {
      let latest = null;
      for (const entry of availabilityLog) {
        if (entry.supplier !== supplierName) continue;
        const ageDays = (now - new Date(entry.date).getTime()) / 86_400_000;
        if (ageDays > windowDays) continue;
        for (const chk of (entry.checks || [])) {
          if (chk.productId !== item.id) continue;
          if (!latest || new Date(entry.date) > new Date(latest.date)) {
            latest = { status: chk.status, date: entry.date };
          }
        }
      }
      if (!latest) continue;

      // Normalise name for cross-supplier matching (lowercase, collapse spaces)
      const key = item.name.toLowerCase().replace(/\s+/g, ' ').trim();
      if (!byProduct[key]) byProduct[key] = { displayName: item.name, suppliers: [] };
      byProduct[key].suppliers.push({ supplierName, ...latest });
    }
  }

  const shortages = [];
  for (const [, data] of Object.entries(byProduct)) {
    const affected = data.suppliers.filter(s => s.status === 'low_stock' || s.status === 'out_of_stock');
    if (affected.length < 2) continue;
    const oos = affected.filter(s => s.status === 'out_of_stock');
    shortages.push({
      productName:       data.displayName,
      affectedSuppliers: affected,
      totalChecked:      data.suppliers.length,
      severity:          oos.length >= 2 ? 'critical' : 'warning',
    });
  }

  return shortages.sort((a, b) =>
    (a.severity === 'critical' ? 0 : 1) - (b.severity === 'critical' ? 0 : 1)
  );
}

// ── 6. Full Market Intelligence Sweep ────────────────────────────────────────
/**
 * Master function: returns the full intelligence picture for all tracked products.
 *
 * Returns:
 *   products       — per-product risk records, sorted critical → stable
 *   supplierRanking — suppliers sorted by number of critical/at-risk items
 *   counts          — { critical, at_risk, monitor, stable, unknown }
 *   systemicShortages
 */
export function getMarketIntelligence(availabilityLog, priceLog, suppliers) {
  const products = [];

  for (const [supplierName, details] of Object.entries(suppliers)) {
    const catalogue = details.catalogue || [];
    const leadTime  = Number(details.leadTimeDays) || 7;

    for (const item of catalogue) {
      const availScore = calcAvailabilityScore(availabilityLog, supplierName, item.id);
      const priceTrend = calcPriceTrend(priceLog, supplierName, item.id);
      const risk       = calcProductRisk(availScore, priceTrend, leadTime);
      const forecast   = forecastAvailability(availScore, priceTrend, 30);

      // Skip items with zero data on both dimensions
      if (!availScore && !priceTrend.prices.length) continue;

      products.push({ key: `${supplierName}::${item.id}`, supplierName, item, leadTime, availScore, priceTrend, risk, forecast });
    }
  }

  // Sort: critical → at_risk → monitor → stable → unknown, then by score ascending
  products.sort((a, b) => {
    const lo = LEVEL_ORDER[a.risk.level] - LEVEL_ORDER[b.risk.level];
    return lo !== 0 ? lo : ((a.availScore?.score ?? 1) - (b.availScore?.score ?? 1));
  });

  // Counts
  const counts = { critical: 0, at_risk: 0, monitor: 0, stable: 0, unknown: 0 };
  for (const p of products) counts[p.risk.level] = (counts[p.risk.level] || 0) + 1;

  // Per-supplier ranking by risk severity
  const supplierMap = {};
  for (const p of products) {
    if (!supplierMap[p.supplierName]) supplierMap[p.supplierName] = { name: p.supplierName, critical: 0, at_risk: 0, monitor: 0, stable: 0, unknown: 0, total: 0 };
    supplierMap[p.supplierName][p.risk.level]++;
    supplierMap[p.supplierName].total++;
  }
  const supplierRanking = Object.values(supplierMap).sort((a, b) =>
    (b.critical * 4 + b.at_risk * 2 + b.monitor) - (a.critical * 4 + a.at_risk * 2 + a.monitor)
  );

  const systemicShortages = detectSystemicShortages(availabilityLog, suppliers);

  return { products, supplierRanking, counts, systemicShortages };
}
