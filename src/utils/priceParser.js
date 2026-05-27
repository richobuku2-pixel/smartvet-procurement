/**
 * priceParser.js — Supplier price text parsing utilities
 *
 * Extracted from PriceUpdateModal so the same logic can be used
 * independently (e.g. in tests or future server-side batch processing).
 *
 * Exported functions:
 *   parsePriceText(text, catalogue)  — main entry, tries hierarchical then flat
 *   parsePriceCSV(text, catalogue)   — for tab/comma-separated price lists
 *   extractPrice(line)               — pull a UGX price from any text line
 */

// ── Stop-words filtered out before token matching ────────────────────────────
const STOPWORDS = new Set([
  'the','and','for','via','per','with','from','each','only','this',
  'that','vial','vials','bottle','bottles','liter','litre','liters','litres',
  'pack','packs','dose','doses','tablet','tablets','unit','units','box','boxes',
  'tin','tins','sachet','sachets','inj','injection','oral','solution','powder',
]);

/**
 * Tokenise a product name or line for fuzzy matching.
 * Keeps '+' so "NCD+IB" stays distinct from "NCD" and "IB".
 */
export function tokenise(str) {
  return (str || '').toLowerCase()
    .replace(/[^a-z0-9+%\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2 && !STOPWORDS.has(w));
}

/**
 * Extract a UGX price from a text line.
 *
 * Priority order ensures "@6500" (explicit supplier marker) beats
 * a bare dose count like "1000DS" that could otherwise parse as 1000.
 */
export function extractPrice(line) {
  const patterns = [
    /@\s*([\d,]+)/,                      // @6500  ← highest priority
    /ugx\s*([\d,]+)/i,                   // UGX 85,000
    /shs?\.?\s*([\d,]+)/i,              // Shs 85,000 / Sh.85000
    /([\d,]+)\s*\/=/,                    // 85,000/=
    /([\d,]+)\s*ugx/i,                   // 85000 UGX
    /(?<![.\d])([\d,]{4,})(?![.\d%])/, // bare 4+ digit number (last resort)
  ];
  for (const pat of patterns) {
    const m = line.match(pat);
    if (m) {
      const raw = m[1].replace(/,/g, '');
      const n = raw.toLowerCase().endsWith('k')
        ? parseFloat(raw) * 1000
        : parseInt(raw, 10);
      if (n >= 500 && n <= 100_000_000) return n;
    }
  }
  return null;
}

// Matches dose-size prefix lines: "1000DS", "500 DS", "1000 Doses", "500dose"
const DOSE_LINE_RE = /^(\d+(?:\.\d+)?)\s*(?:DS|dose[s]?)\b/i;

/**
 * Hierarchical parser — handles WhatsApp / phone-call format where a
 * disease/category name is on its own line followed by dose+price lines:
 *
 *   NCD                ← category header (no price on this line)
 *   1000DS @6500       →  "NCD 1000DS" @ UGX 6,500
 *   500DS  @5500       →  "NCD 500DS"  @ UGX 5,500
 *   NCD+IB             ← new category
 *   1000DS @9500       →  "NCD+IB 1000DS" @ UGX 9,500
 *
 * Returns null when the text doesn't match this pattern (triggers flat fallback).
 */
function parseHierarchicalText(text, catalogue) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let context = null;
  const candidates = [];

  for (const line of lines) {
    const doseMatch = line.match(DOSE_LINE_RE);

    const atPrice = (() => {
      const m = line.match(/@\s*([\d,]+)/);
      if (!m) return null;
      const n = parseInt(m[1].replace(/,/g, ''), 10);
      return n >= 500 && n <= 100_000_000 ? n : null;
    })();

    // Strip dose prefix before bare-number extraction so "1000DS" ≠ 1000
    const priceFromLine = atPrice ?? extractPrice(line.replace(DOSE_LINE_RE, '').trim());

    if (doseMatch && priceFromLine !== null) {
      if (context) {
        const doseStr = `${Math.round(parseFloat(doseMatch[1]))}DS`;
        candidates.push({ combinedName: `${context} ${doseStr}`, price: priceFromLine, line });
      }
    } else if (!doseMatch && priceFromLine === null && line.length <= 50) {
      context = line.trim(); // short priceless line → new category header
    }
  }

  if (!candidates.length) return null;

  const results = [];
  const used = new Set();

  for (const { combinedName, price, line } of candidates) {
    const cl = combinedName.toLowerCase();

    // 1 – exact match
    let bestItem = catalogue.find(i => i.name.toLowerCase() === cl && !used.has(i.id));

    // 2 – substring match
    if (!bestItem) {
      bestItem = catalogue.find(i => !used.has(i.id) && (
        cl.includes(i.name.toLowerCase()) || i.name.toLowerCase().includes(cl)
      ));
    }

    // 3 – token overlap (≥ 40% match threshold)
    if (!bestItem) {
      const nameTokens = tokenise(combinedName);
      let bestScore = 0;
      for (const item of catalogue) {
        if (used.has(item.id)) continue;
        const itemTokens = tokenise(item.name);
        const matches = nameTokens.filter(
          t => itemTokens.some(it => it === t || it.includes(t) || t.includes(it))
        ).length;
        const score = nameTokens.length ? matches / nameTokens.length : 0;
        if (score > bestScore && score >= 0.4) { bestScore = score; bestItem = item; }
      }
    }

    if (bestItem) {
      used.add(bestItem.id);
      results.push({
        catalogueId: bestItem.id,
        productName: bestItem.name,
        unitPrice:   price,
        unit:        bestItem.unit || '',
        matchLine:   `${combinedName} (from: "${line}")`,
        score:       1.0,
      });
    }
  }

  return results.length ? results : null;
}

/**
 * Flat parser — line-by-line keyword matching.
 * Fallback when text doesn't follow the hierarchical category/dose format.
 */
function parsePriceTextFlat(text, catalogue) {
  const lines = text.split('\n').filter(l => l.trim());
  const results = [];
  for (const item of catalogue) {
    const itemTokens = tokenise(item.name);
    if (!itemTokens.length) continue;
    let bestLine = null, bestScore = 0;
    for (const line of lines) {
      const lineTokens = new Set(tokenise(line));
      const matches = itemTokens.filter(
        t => [...lineTokens].some(lt => lt.includes(t) || t.includes(lt))
      ).length;
      const score = matches / itemTokens.length;
      if (score > bestScore && score >= 0.35) { bestScore = score; bestLine = line; }
    }
    if (!bestLine) continue;
    const price = extractPrice(bestLine);
    if (price) results.push({
      catalogueId: item.id, productName: item.name, unitPrice: price,
      unit: item.unit || '', matchLine: bestLine, score: bestScore,
    });
  }
  return results;
}

/**
 * Main entry — tries hierarchical parser first (WhatsApp/phone format),
 * falls back to flat line-by-line parser.
 */
export function parsePriceText(text, catalogue) {
  const hierarchical = parseHierarchicalText(text, catalogue);
  if (hierarchical) return hierarchical;
  return parsePriceTextFlat(text, catalogue);
}

/**
 * CSV / TSV parser — for structured price lists with named columns.
 * Falls back to parsePriceText when the input doesn't look tabular.
 */
export function parsePriceCSV(text, catalogue) {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return parsePriceText(text, catalogue);

  const delim = lines[0].includes('\t') ? '\t' : ',';
  const rows = lines.map(l =>
    l.split(delim).map(c => c.trim().replace(/^["']|["']$/g, ''))
  );
  const headers = rows[0].map(h => h.toLowerCase());

  let nameCol  = headers.findIndex(h => /name|product|item|description|drug|medicine/.test(h));
  let priceCol = headers.findIndex(h => /price|cost|amount|rate|ugx|shs|selling/.test(h));
  if (nameCol  === -1) nameCol  = 0;
  if (priceCol === -1) priceCol = rows[0].length > 1 ? 1 : 0;

  const results = [];
  for (const row of rows.slice(1)) {
    if (!row[nameCol]) continue;
    const rowName  = row[nameCol];
    const priceRaw = row[priceCol] || row.join(' ');
    const price    = extractPrice(priceRaw) ?? extractPrice(row.join(' '));
    if (!price) continue;

    const rowTokens = tokenise(rowName);
    let bestItem = null, bestScore = 0;
    for (const item of catalogue) {
      const itemTokens = tokenise(item.name);
      const matches = itemTokens.filter(
        t => rowTokens.some(rt => rt.includes(t) || t.includes(rt))
      ).length;
      const score = itemTokens.length ? matches / itemTokens.length : 0;
      if (score > bestScore && score >= 0.35) { bestScore = score; bestItem = item; }
    }
    if (bestItem) results.push({
      catalogueId: bestItem.id, productName: bestItem.name, unitPrice: price,
      unit: bestItem.unit || '', matchLine: rowName, score: bestScore,
    });
  }
  return results.length ? results : parsePriceText(text, catalogue);
}
