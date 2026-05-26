import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { getMarketIntelligence, RISK_META } from '../utils/marketIntelligence';
import { timeAgo, formatCurrency } from '../utils/formatter';

// ── Helpers ───────────────────────────────────────────────────────────────────
function RiskBadge({ level, size = 'sm' }) {
  const m = RISK_META[level] || RISK_META.unknown;
  const px = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${px} ${m.badge}`}>
      {m.emoji} {m.label}
    </span>
  );
}

function ScoreBar({ score }) {
  if (score === null || score === undefined) return <span className="text-xs text-gray-400">—</span>;
  const pct = Math.round(score * 100);
  const color = score >= 0.75 ? 'bg-green-500' : score >= 0.50 ? 'bg-amber-400' : score >= 0.25 ? 'bg-orange-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden" style={{ minWidth: 48 }}>
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-gray-500 w-7 text-right">{pct}%</span>
    </div>
  );
}

function TrendArrow({ trend, size = 'sm' }) {
  if (!trend || trend === 'unknown') return <span className="text-gray-300 text-xs">—</span>;
  const map = {
    rising:    { icon: '↑', cls: 'text-red-500' },
    falling:   { icon: '↓', cls: 'text-green-600' },
    stable:    { icon: '→', cls: 'text-gray-400' },
    improving: { icon: '↑', cls: 'text-green-600' },
    worsening: { icon: '↓', cls: 'text-red-500' },
  };
  const { icon, cls } = map[trend] || { icon: '·', cls: 'text-gray-400' };
  return <span className={`font-bold ${cls} ${size === 'lg' ? 'text-base' : 'text-sm'}`}>{icon}</span>;
}

const LEVEL_FILTER_OPTS = [
  { value: 'all',      label: 'All Levels' },
  { value: 'critical', label: '🔴 Critical' },
  { value: 'at_risk',  label: '🟠 At Risk' },
  { value: 'monitor',  label: '🟡 Monitor' },
  { value: 'stable',   label: '🟢 Stable' },
];

// ── Main Page ────────────────────────────────────────────────────────────────
export default function MarketIntelligence() {
  const { availabilityLog, priceLog, suppliers } = useApp();
  const [levelFilter, setLevelFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('risk');  // 'risk' | 'score' | 'name' | 'checked'

  const intel = useMemo(
    () => getMarketIntelligence(availabilityLog, priceLog, suppliers),
    [availabilityLog, priceLog, suppliers]
  );

  const supplierNames = useMemo(() => Object.keys(suppliers).sort(), [suppliers]);

  const filtered = useMemo(() => {
    let list = intel.products;
    if (levelFilter !== 'all') list = list.filter(p => p.risk.level === levelFilter);
    if (supplierFilter !== 'all') list = list.filter(p => p.supplierName === supplierFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p => p.item.name?.toLowerCase().includes(q) || p.supplierName.toLowerCase().includes(q));
    }
    const LEVEL_ORDER = { critical: 0, at_risk: 1, monitor: 2, stable: 3, unknown: 4 };
    if (sortBy === 'risk')    return [...list].sort((a, b) => LEVEL_ORDER[a.risk.level] - LEVEL_ORDER[b.risk.level] || (a.risk.score ?? 1) - (b.risk.score ?? 1));
    if (sortBy === 'score')   return [...list].sort((a, b) => (a.risk.score ?? 1) - (b.risk.score ?? 1));
    if (sortBy === 'name')    return [...list].sort((a, b) => a.item.name.localeCompare(b.item.name));
    if (sortBy === 'checked') return [...list].sort((a, b) => (b.availScore?.daysSinceCheck ?? 9999) - (a.availScore?.daysSinceCheck ?? 9999));
    return list;
  }, [intel.products, levelFilter, supplierFilter, search, sortBy]);

  const { counts, supplierRanking, systemicShortages } = intel;
  const totalTracked = Object.values(counts).reduce((s, n) => s + n, 0);
  const hasData = totalTracked > 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            🧠 Market Intelligence
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Predictive availability risk across all tracked suppliers · {totalTracked} products monitored
          </p>
        </div>
        {!hasData && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 max-w-sm">
            ℹ️ Log availability check-ins on Supplier cards to activate predictions. Price logs also feed the intelligence.
          </div>
        )}
      </div>

      {/* ── Systemic shortage alerts ───────────────────────────────────────── */}
      {systemicShortages.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">⚡ Market-Wide Shortage Signals</p>
          {systemicShortages.map((s, i) => (
            <div key={i} className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${s.severity === 'critical' ? 'bg-red-50 border-red-300' : 'bg-orange-50 border-orange-300'}`}>
              <span className="text-lg">{s.severity === 'critical' ? '🚨' : '⚠️'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{s.productName}</p>
                <p className="text-xs text-gray-500">
                  Low / out-of-stock at {s.affectedSuppliers.length} suppliers:&nbsp;
                  {s.affectedSuppliers.map(a => a.supplierName).join(', ')}
                </p>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.severity === 'critical' ? 'bg-red-200 text-red-800' : 'bg-orange-200 text-orange-800'}`}>
                {s.severity === 'critical' ? 'Market Shortage' : 'Supply Pressure'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Summary cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { level: 'critical', icon: '🔴', desc: 'Immediate action' },
          { level: 'at_risk',  icon: '🟠', desc: 'Order soon' },
          { level: 'monitor',  icon: '🟡', desc: 'Watch closely' },
          { level: 'stable',   icon: '🟢', desc: 'All clear' },
        ].map(({ level, icon, desc }) => {
          const m = RISK_META[level];
          const n = counts[level] || 0;
          return (
            <button
              key={level}
              onClick={() => setLevelFilter(p => p === level ? 'all' : level)}
              className={`rounded-xl border p-4 text-left transition-all hover:shadow-md ${levelFilter === level ? `${m.bg} ${m.border} ring-2 ring-offset-1 ring-current` : 'bg-white border-gray-200 hover:border-gray-300'}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{icon}</span>
                <span className={`text-3xl font-black ${n > 0 && (level === 'critical' || level === 'at_risk') ? m.text : 'text-gray-700'}`}>{n}</span>
              </div>
              <p className={`mt-1 text-sm font-semibold ${m.text}`}>{m.label}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{desc}</p>
            </button>
          );
        })}
      </div>

      {/* ── Main content: table + supplier ranking ─────────────────────────── */}
      <div className="flex gap-6 items-start flex-wrap lg:flex-nowrap">

        {/* Left: product risk table */}
        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Table toolbar */}
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search product or supplier…"
              className="flex-1 min-w-32 text-xs border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-teal-400"
            />
            <select
              value={levelFilter}
              onChange={e => setLevelFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-teal-400 bg-white"
            >
              {LEVEL_FILTER_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select
              value={supplierFilter}
              onChange={e => setSupplierFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-teal-400 bg-white"
            >
              <option value="all">All Suppliers</option>
              {supplierNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-teal-400 bg-white"
            >
              <option value="risk">Sort: Risk Level</option>
              <option value="score">Sort: Score</option>
              <option value="name">Sort: Name</option>
              <option value="checked">Sort: Last Checked</option>
            </select>
          </div>

          {/* Table */}
          {!hasData ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="text-5xl mb-4">📡</div>
              <p className="font-semibold text-gray-600">No intelligence data yet</p>
              <p className="text-sm text-gray-400 mt-2 max-w-xs">
                Start logging availability check-ins on your supplier cards — each check feeds the prediction engine.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">No products match your filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                    <th className="text-left px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Supplier</th>
                    <th className="text-center px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Risk</th>
                    <th className="text-left px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Score</th>
                    <th className="text-center px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Avail Trend</th>
                    <th className="text-center px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Price</th>
                    <th className="text-center px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">30d Forecast</th>
                    <th className="text-right px-4 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Last Check</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(p => {
                    const m = RISK_META[p.risk.level] || RISK_META.unknown;
                    const fm = p.forecast ? (RISK_META[p.forecast.level] || RISK_META.unknown) : null;
                    return (
                      <tr key={p.key} className={`hover:bg-gray-50 transition-colors ${p.risk.level === 'critical' ? 'bg-red-50/30' : ''}`}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800 text-xs leading-tight">{p.item.name}</p>
                          {p.risk.flags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {p.risk.flags.slice(0, 2).map(f => (
                                <span key={f.code} className="text-[9px] text-gray-500">{f.icon} {f.label}</span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 hidden sm:table-cell">
                          <p className="text-xs text-gray-600 truncate max-w-[120px]">{p.supplierName}</p>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <RiskBadge level={p.risk.level} />
                        </td>
                        <td className="px-3 py-3 hidden md:table-cell w-28">
                          <ScoreBar score={p.risk.score} />
                        </td>
                        <td className="px-3 py-3 text-center hidden md:table-cell">
                          {p.availScore ? (
                            <span className="flex items-center justify-center gap-1">
                              <TrendArrow trend={p.availScore.trend} />
                              <span className="text-[10px] text-gray-500 capitalize">{p.availScore.trend}</span>
                            </span>
                          ) : <span className="text-gray-300 text-xs">—</span>}
                        </td>
                        <td className="px-3 py-3 text-center hidden lg:table-cell">
                          {p.priceTrend.trend !== 'unknown' ? (
                            <span className="flex items-center justify-center gap-1">
                              <TrendArrow trend={p.priceTrend.trend} />
                              {p.priceTrend.pctChange !== null && (
                                <span className="text-[10px] text-gray-500">{p.priceTrend.pctChange > 0 ? '+' : ''}{p.priceTrend.pctChange}%</span>
                              )}
                            </span>
                          ) : <span className="text-gray-300 text-xs">—</span>}
                        </td>
                        <td className="px-3 py-3 text-center hidden lg:table-cell">
                          {fm ? (
                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${fm.badge}`}>
                              <TrendArrow trend={p.forecast.direction} size="xs" />
                              {fm.label}
                            </span>
                          ) : <span className="text-[10px] text-gray-300">insufficient data</span>}
                        </td>
                        <td className="px-4 py-3 text-right hidden sm:table-cell">
                          {p.availScore ? (
                            <span className={`text-[10px] ${p.risk.stale ? 'text-orange-500 font-semibold' : 'text-gray-400'}`}>
                              {timeAgo(p.availScore.lastCheckDate)}
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-300">never</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="px-4 py-2 border-t border-gray-50 text-[10px] text-gray-400 text-right">
                {filtered.length} of {totalTracked} products
              </div>
            </div>
          )}
        </div>

        {/* Right: supplier risk ranking + how it works */}
        <div className="w-full lg:w-64 space-y-4 flex-shrink-0">

          {/* Supplier ranking */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <p className="text-xs font-semibold text-gray-700">Supplier Risk Ranking</p>
              <p className="text-[10px] text-gray-400">Sorted by severity score</p>
            </div>
            {supplierRanking.length === 0 ? (
              <p className="px-4 py-6 text-xs text-gray-400 text-center">No data yet</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {supplierRanking.map((s, i) => (
                  <div key={s.name} className="px-4 py-3 flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-300 w-4">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{s.name}</p>
                      <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                        {s.critical > 0 && <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold">{s.critical} critical</span>}
                        {s.at_risk > 0  && <span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-semibold">{s.at_risk} at risk</span>}
                        {s.monitor > 0  && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">{s.monitor} monitor</span>}
                        {s.stable > 0   && <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">{s.stable} stable</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* How the score works */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-700 mb-3">How Scores Are Calculated</p>
            <div className="space-y-2.5 text-[10px] text-gray-500 leading-relaxed">
              <div className="flex gap-2">
                <span className="text-base leading-none">⚖️</span>
                <p><strong className="text-gray-700">Weighted History</strong> — recent check-ins count more. A check today outweighs one from 3 weeks ago.</p>
              </div>
              <div className="flex gap-2">
                <span className="text-base leading-none">🕐</span>
                <p><strong className="text-gray-700">Staleness Penalty</strong> — if data is older than 3× the supplier's lead time, the score regresses toward 50% uncertainty.</p>
              </div>
              <div className="flex gap-2">
                <span className="text-base leading-none">📈</span>
                <p><strong className="text-gray-700">Price Signal</strong> — a rising price trend reduces the availability score (price spikes often precede shortages).</p>
              </div>
              <div className="flex gap-2">
                <span className="text-base leading-none">📡</span>
                <p><strong className="text-gray-700">30-Day Forecast</strong> — extrapolates the current trend. Needs ≥2 check-ins to activate.</p>
              </div>
              <div className="flex gap-2">
                <span className="text-base leading-none">🚨</span>
                <p><strong className="text-gray-700">Systemic Shortage</strong> — triggered when the same product is low/OOS at 2+ suppliers simultaneously.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
