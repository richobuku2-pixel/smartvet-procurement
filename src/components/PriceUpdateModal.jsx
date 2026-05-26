/**
 * PriceUpdateModal — 4-tier supplier price capture
 *
 * Tiers:
 *  1. 📞 Manual / Phone  — inline price inputs for each catalogue item
 *  2. 💬 Paste / WhatsApp — smart text parser extracts UGX prices
 *  3. 📎 File Upload      — CSV / Excel price list (uses xlsx-js-style)
 *  4. 🌐 Web Scrape       — fetch page text via /api/scrape-prices then parse
 *
 * All tiers feed into an editable ParsePreview before saving so the user
 * can review and correct any mismatches before committing to the log.
 */

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx-js-style';
import { timeAgo } from '../utils/formatter';

// ── Price text parsing helpers ────────────────────────────────────────────────
const STOPWORDS = new Set([
  'the','and','for','via','per','with','from','each','only','this',
  'that','vial','vials','bottle','bottles','liter','litre','liters','litres',
  'pack','packs','dose','doses','tablet','tablets','unit','units','box','boxes',
  'tin','tins','sachet','sachets','inj','injection','oral','solution','powder',
]);

function tokenise(str) {
  return (str || '').toLowerCase()
    .replace(/[^a-z0-9+%\s]/g, ' ')   // keep + so NCD+IB stays distinct
    .split(/\s+/)
    .filter(w => w.length >= 2 && !STOPWORDS.has(w));
}

/**
 * Extract a price from a line.
 * Priority order ensures "@6500" beats "1000DS" (dose count).
 */
function extractPrice(line) {
  const patterns = [
    /@\s*([\d,]+)/,                       // @6500  ← highest priority (explicit marker)
    /ugx\s*([\d,]+)/i,                    // UGX 85,000
    /shs?\.?\s*([\d,]+)/i,               // Shs 85,000 / Sh.85000
    /([\d,]+)\s*\/=/,                     // 85,000/=
    /([\d,]+)\s*ugx/i,                    // 85000 UGX
    /(?<![.\d])([\d,]{4,})(?![.\d%])/,  // bare 4+ digit number (fallback)
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

// Matches dose-size lines: "1000DS", "500 DS", "1000 Doses", "500dose"
const DOSE_LINE_RE = /^(\d+(?:\.\d+)?)\s*(?:DS|dose[s]?)\b/i;

/**
 * Hierarchical parser — handles WhatsApp / phone-call format where the
 * category name is on its own line followed by dose+price lines:
 *
 *   NCD                    ← category header (no price)
 *   1000DS @6500           ← dose line  →  combined: "NCD 1000DS" @ 6500
 *   500DS  @5500           ← dose line  →  combined: "NCD 500DS"  @ 5500
 *   NCD+IB                 ← new category
 *   1000DS @9500           ← combined: "NCD+IB 1000DS" @ 9500
 *
 * Returns null when the text doesn't fit this pattern (triggers flat fallback).
 */
function parseHierarchicalText(text, catalogue) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let context = null;
  const candidates = []; // { combinedName, price }

  for (const line of lines) {
    const doseMatch = line.match(DOSE_LINE_RE);
    // For @ price: extract from the line directly (ignores the "and 15,000" second price)
    const atPrice   = (() => {
      const m = line.match(/@\s*([\d,]+)/);
      if (!m) return null;
      const n = parseInt(m[1].replace(/,/g, ''), 10);
      return n >= 500 && n <= 100_000_000 ? n : null;
    })();
    // Strip dose prefix before bare-number extraction so "1000DS" isn't read as 1000
    const priceFromLine = atPrice ?? extractPrice(line.replace(DOSE_LINE_RE, '').trim());

    if (doseMatch && priceFromLine !== null) {
      // Dose+price line — combine with current context
      if (context) {
        const doseStr = `${Math.round(parseFloat(doseMatch[1]))}DS`;
        candidates.push({ combinedName: `${context} ${doseStr}`, price: priceFromLine, line });
      }
    } else if (!doseMatch && priceFromLine === null && line.length <= 50) {
      // No dose, no price, short enough → treat as category header
      context = line.trim();
    }
    // Lines with a price but no dose and no context: skip in hierarchical mode
  }

  if (!candidates.length) return null;

  // Match each combined name to the catalogue
  const results = [];
  const used = new Set();
  for (const { combinedName, price, line } of candidates) {
    const cl = combinedName.toLowerCase();

    // Strategy 1: exact case-insensitive match
    let bestItem = catalogue.find(i => i.name.toLowerCase() === cl && !used.has(i.id));

    // Strategy 2: one is a substring of the other (handles slight name variations)
    if (!bestItem) {
      bestItem = catalogue.find(i => !used.has(i.id) && (
        cl.includes(i.name.toLowerCase()) || i.name.toLowerCase().includes(cl)
      ));
    }

    // Strategy 3: token overlap fallback
    if (!bestItem) {
      const nameTokens = tokenise(combinedName);
      let bestScore = 0;
      for (const item of catalogue) {
        if (used.has(item.id)) continue;
        const itemTokens = tokenise(item.name);
        const matches = nameTokens.filter(t => itemTokens.some(it => it === t || it.includes(t) || t.includes(it))).length;
        const score = nameTokens.length ? matches / nameTokens.length : 0;
        if (score > bestScore && score >= 0.4) { bestScore = score; bestItem = item; }
      }
    }

    if (bestItem) {
      used.add(bestItem.id);
      results.push({
        catalogueId: bestItem.id, productName: bestItem.name,
        unitPrice: price, unit: bestItem.unit || '',
        matchLine: `${combinedName} (from: "${line}")`, score: 1.0,
      });
    }
  }

  return results.length ? results : null;
}

/**
 * Flat parser — original line-by-line keyword matching.
 * Used when text doesn't follow the hierarchical category/dose format.
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
      const matches = itemTokens.filter(t => [...lineTokens].some(lt => lt.includes(t) || t.includes(lt))).length;
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
 * Main entry point — tries hierarchical first, falls back to flat.
 */
function parsePriceText(text, catalogue) {
  const hierarchical = parseHierarchicalText(text, catalogue);
  if (hierarchical) return hierarchical;
  return parsePriceTextFlat(text, catalogue);
}

function parsePriceCSV(text, catalogue) {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return parsePriceText(text, catalogue); // fall back to text parser

  const delim = lines[0].includes('\t') ? '\t' : ',';
  const rows = lines.map(l => l.split(delim).map(c => c.trim().replace(/^["']|["']$/g, '')));
  const headers = rows[0].map(h => h.toLowerCase());

  let nameCol = headers.findIndex(h => /name|product|item|description|drug|medicine/.test(h));
  let priceCol = headers.findIndex(h => /price|cost|amount|rate|ugx|shs|selling/.test(h));
  if (nameCol === -1) nameCol = 0;
  if (priceCol === -1) priceCol = rows[0].length > 1 ? 1 : 0;

  const results = [];
  for (const row of rows.slice(1)) {
    if (!row[nameCol]) continue;
    const rowName = row[nameCol];
    const priceRaw = row[priceCol] || row.join(' ');
    const price = extractPrice(priceRaw) ?? extractPrice(row.join(' '));
    if (!price) continue;

    const rowTokens = tokenise(rowName);
    let bestItem = null, bestScore = 0;
    for (const item of catalogue) {
      const itemTokens = tokenise(item.name);
      const matches = itemTokens.filter(t => rowTokens.some(rt => rt.includes(t) || t.includes(rt))).length;
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

// ── ParsePreview (shared by paste / file / url tiers) ─────────────────────────
function ParsePreview({ results, latestPrices, onEdit }) {
  if (results.length === 0) return (
    <div className="bg-gray-50 rounded-lg p-4 text-center">
      <p className="text-xs text-gray-500">No products matched — try adjusting the text or use Manual Entry.</p>
    </div>
  );
  return (
    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
      <p className="text-xs font-semibold text-gray-600">
        {results.length} product{results.length !== 1 ? 's' : ''} detected — review &amp; adjust if needed:
      </p>
      <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
        {results.map(r => {
          const latest = latestPrices[r.catalogueId];
          const pct = latest ? Math.round(((r.unitPrice - latest.price) / latest.price) * 100) : null;
          const changed = pct !== null && pct !== 0;
          return (
            <div key={r.catalogueId} className="flex items-start gap-2 bg-white rounded-lg px-2 py-1.5 border border-gray-100">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">{r.productName}</p>
                {r.matchLine && (
                  <p className="text-[10px] text-gray-400 truncate italic">matched: {r.matchLine}</p>
                )}
                {changed && (
                  <p className={`text-[10px] font-semibold ${pct > 0 ? 'text-red-500' : 'text-green-600'}`}>
                    {pct > 0 ? '▲' : '▼'} {Math.abs(pct)}% vs last (UGX {latest.price.toLocaleString()})
                  </p>
                )}
                {!latest && (
                  <p className="text-[10px] text-gray-400">first price logged for this product</p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-[10px] text-gray-400">UGX</span>
                <input
                  type="number"
                  min="0"
                  value={r.unitPrice}
                  onChange={e => onEdit(r.catalogueId, Number(e.target.value))}
                  className="w-24 text-xs border rounded px-1.5 py-1 font-mono focus:outline-none focus:ring-1 focus:ring-teal-500 text-right"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function PriceUpdateModal({ supplierName, catalogue, currentUser, latestPrices = {}, onSave, onClose }) {
  const [tier, setTier] = useState('manual');

  // Manual
  const [manualPrices, setManualPrices] = useState(
    () => Object.fromEntries(catalogue.map(item => [item.id, latestPrices[item.id]?.price || '']))
  );
  // Paste
  const [pasteText, setPasteText]   = useState('');
  const [parsedPaste, setParsedPaste] = useState(null);
  // File
  const [fileResults, setFileResults] = useState(null);
  const [fileName, setFileName]       = useState('');
  const fileRef = useRef(null);
  // URL
  const [urlInput, setUrlInput]       = useState('');
  const [scraping, setScraping]       = useState(false);
  const [scrapeError, setScrapeError] = useState('');
  const [scrapeResults, setScrapeResults] = useState(null);
  // Common
  const [notes, setNotes] = useState('');

  const setManualPrice = (id, val) => setManualPrices(p => ({ ...p, [id]: val }));

  // AI parsing state
  const [aiParsing, setAiParsing]   = useState(false);
  const [aiError, setAiError]       = useState('');
  const [parseSource, setParseSource] = useState(''); // 'regex' | 'ai'

  // Regex parse (default)
  const handleParsePaste = () => {
    setAiError('');
    setParseSource('regex');
    setParsedPaste(parsePriceText(pasteText, catalogue));
  };

  // Gemini AI parse
  const handleAiParse = async () => {
    if (!pasteText.trim()) return;
    setAiParsing(true);
    setAiError('');
    setParseSource('ai');
    try {
      const res = await fetch('/api/parse-prices-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: pasteText,
          catalogue: catalogue.map(i => ({ id: i.id, name: i.name, unit: i.unit })),
          mode: 'price',
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setAiError(data.error || 'AI parse failed'); setAiParsing(false); return; }
      // Map AI response to ParsePreview format
      const mapped = (data.items || []).map(item => {
        const cat = catalogue.find(c => c.id === item.catalogueId);
        return cat ? {
          catalogueId: item.catalogueId,
          productName: cat.name,
          unitPrice: Number(item.unitPrice),
          unit: cat.unit || '',
          matchLine: '🤖 AI matched',
          score: 1,
        } : null;
      }).filter(Boolean);
      if (!mapped.length && data.warning) setAiError(data.warning);
      setParsedPaste(mapped);
    } catch (err) {
      setAiError(err.message);
    }
    setAiParsing(false);
  };

  // File upload
  const handleFile = async (file) => {
    setFileName(file.name);
    setFileResults(null);
    const ext = file.name.split('.').pop().toLowerCase();
    try {
      if (ext === 'xlsx' || ext === 'xls') {
        const buf = await file.arrayBuffer();
        const wb  = XLSX.read(buf, { type: 'array' });
        const ws  = wb.Sheets[wb.SheetNames[0]];
        const csv = XLSX.utils.sheet_to_csv(ws);
        setFileResults(parsePriceCSV(csv, catalogue));
      } else {
        const text = await file.text();
        setFileResults(parsePriceCSV(text, catalogue));
      }
    } catch (err) {
      alert(`Could not read file: ${err.message}`);
    }
  };

  // Web scrape
  const handleScrape = async () => {
    setScraping(true); setScrapeError(''); setScrapeResults(null);
    try {
      const resp = await fetch(`/api/scrape-prices?url=${encodeURIComponent(urlInput)}`);
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || `HTTP ${resp.status}`);
      setScrapeResults(parsePriceText(data.text, catalogue));
    } catch (err) {
      setScrapeError(err.message);
    } finally {
      setScraping(false);
    }
  };

  // Build save payload
  const buildItems = () => {
    if (tier === 'manual') {
      return catalogue
        .filter(item => manualPrices[item.id] && Number(manualPrices[item.id]) > 0)
        .map(item => ({
          catalogueId: item.id, productName: item.name,
          unitPrice: Number(manualPrices[item.id]), currency: 'UGX', unit: item.unit || '',
        }));
    }
    const parsed = tier === 'paste' ? parsedPaste : tier === 'file' ? fileResults : scrapeResults;
    return (parsed || []).map(p => ({
      catalogueId: p.catalogueId, productName: p.productName,
      unitPrice: p.unitPrice, currency: 'UGX', unit: p.unit || '',
    }));
  };

  const handleSave = () => {
    const items = buildItems();
    if (!items.length) { alert('No prices to save — enter at least one price.'); return; }
    onSave({
      supplier: supplierName, items,
      recordedBy: currentUser?.name || currentUser?.email || 'Unknown',
      source: tier === 'url' ? 'web_scrape' : tier,
      notes,
    });
    onClose();
  };

  const itemCount = (() => {
    if (tier === 'manual') return Object.values(manualPrices).filter(v => v && Number(v) > 0).length;
    const p = tier === 'paste' ? parsedPaste : tier === 'file' ? fileResults : scrapeResults;
    return p?.length || 0;
  })();

  const TIERS = [
    { key: 'manual', icon: '📞', label: 'Phone / Manual',   desc: 'Enter prices directly' },
    { key: 'paste',  icon: '💬', label: 'WhatsApp / Paste', desc: 'Paste a price list text' },
    { key: 'file',   icon: '📎', label: 'File Upload',      desc: 'CSV or Excel price list' },
    { key: 'url',    icon: '🌐', label: 'Web Scrape',       desc: 'Fetch from supplier URL' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-10">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-700 to-teal-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {supplierName.charAt(0)}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">Log Price Update</p>
            <p className="text-xs text-gray-400">{supplierName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">✕</button>
        </div>

        {/* Tier selector */}
        <div className="grid grid-cols-4 gap-1.5 px-5 pt-3">
          {TIERS.map(t => (
            <button key={t.key} onClick={() => setTier(t.key)}
              className={`px-2 py-2 rounded-lg text-left transition-colors ${
                tier === t.key ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <div className="text-xs font-semibold">{t.icon} {t.label}</div>
              <div className={`text-[10px] mt-0.5 leading-tight ${tier === t.key ? 'text-teal-100' : 'text-gray-400'}`}>{t.desc}</div>
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">

          {/* ── Manual ── */}
          {tier === 'manual' && (
            <>
              <p className="text-xs text-gray-500">Enter the price you were quoted for each product. Leave blank to skip.</p>
              {catalogue.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">No catalogue items. Add products to this supplier first.</p>
              ) : (
                <div className="space-y-1">
                  {catalogue.map(item => {
                    const latest = latestPrices[item.id];
                    const cur = Number(manualPrices[item.id] || 0);
                    const pct = latest && cur > 0 ? Math.round(((cur - latest.price) / latest.price) * 100) : null;
                    return (
                      <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">{item.name}</p>
                          <div className="flex items-center gap-2">
                            {latest ? (
                              <p className="text-[10px] text-gray-400">
                                Last: UGX {latest.price.toLocaleString()} · {timeAgo(latest.date)}
                              </p>
                            ) : (
                              <p className="text-[10px] text-gray-400">No price logged yet</p>
                            )}
                            {pct !== null && pct !== 0 && (
                              <span className={`text-[10px] font-bold ${pct > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                {pct > 0 ? '▲' : '▼'}{Math.abs(pct)}%
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-[10px] text-gray-400">UGX</span>
                          <input
                            type="number" min="0"
                            value={manualPrices[item.id] || ''}
                            onChange={e => setManualPrice(item.id, e.target.value)}
                            placeholder="—"
                            className="w-24 text-xs border rounded px-2 py-1 font-mono focus:outline-none focus:ring-1 focus:ring-teal-500 text-right"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ── Paste ── */}
          {tier === 'paste' && (
            <>
              <p className="text-xs text-gray-500">
                Paste a WhatsApp message, email, or plain text price list.
                Use <strong>Regex</strong> for structured lists, <strong>AI</strong> for free-form natural language.
              </p>
              <textarea
                value={pasteText}
                onChange={e => { setPasteText(e.target.value); setParsedPaste(null); setAiError(''); }}
                placeholder={"Paste any supplier text here...\n\nStructured:\n  NCD\n  1000DS @6500\n  500DS @5500\n\nFree-form:\n  'NCD and gumboro tight this week, fowl pox completely gone, prices going up'"}
                rows={7}
                className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono resize-none"
              />
              {/* Parse buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleParsePaste}
                  disabled={!pasteText.trim() || aiParsing}
                  className="px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-1.5"
                >
                  🔍 Regex Parse
                </button>
                <button
                  onClick={handleAiParse}
                  disabled={!pasteText.trim() || aiParsing}
                  className="px-4 py-2 bg-violet-600 text-white text-xs font-semibold rounded-lg hover:bg-violet-700 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {aiParsing ? (
                    <><span className="animate-spin inline-block">⟳</span> Asking Gemini…</>
                  ) : (
                    <>🤖 AI Parse</>
                  )}
                </button>
                {parsedPaste !== null && (
                  <span className="text-[10px] text-gray-400 ml-auto">
                    {parseSource === 'ai' ? '🤖 Gemini 2.0 Flash' : '🔍 Regex'} · {parsedPaste.length} match{parsedPaste.length !== 1 ? 'es' : ''}
                  </span>
                )}
              </div>
              {/* AI error */}
              {aiError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                  ⚠ {aiError}
                  {aiError.includes('GEMINI_API_KEY') && (
                    <p className="mt-1 text-red-500">Add <code className="bg-red-100 px-1 rounded">GEMINI_API_KEY=your_key</code> to your <code>.env</code> file and Vercel environment variables.</p>
                  )}
                </div>
              )}
              {parsedPaste !== null && (
                <ParsePreview results={parsedPaste} latestPrices={latestPrices}
                  onEdit={(id, price) => setParsedPaste(p => p.map(i => i.catalogueId === id ? { ...i, unitPrice: price } : i))} />
              )}
            </>
          )}

          {/* ── File ── */}
          {tier === 'file' && (
            <>
              <p className="text-xs text-gray-500">
                Upload a price list file. SmartVet reads CSV and Excel (.xlsx) files and auto-detects the product name and price columns.
              </p>
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-teal-400 transition-colors cursor-pointer group"
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              >
                <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.txt,.tsv" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                <p className="text-3xl mb-2">📎</p>
                <p className="text-xs font-semibold text-gray-600 group-hover:text-teal-700">
                  {fileName || 'Click to upload or drag & drop'}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">CSV, Excel (.xlsx / .xls), or plain text</p>
              </div>
              {fileResults !== null && (
                <ParsePreview results={fileResults} latestPrices={latestPrices}
                  onEdit={(id, price) => setFileResults(p => p.map(i => i.catalogueId === id ? { ...i, unitPrice: price } : i))} />
              )}
            </>
          )}

          {/* ── URL / Web Scrape ── */}
          {tier === 'url' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                Enter the URL of a supplier price list page. SmartVet will fetch the page text and extract prices using the same parser as the paste tool.
              </p>
              <div className="flex gap-2">
                <input
                  type="url" value={urlInput}
                  onChange={e => { setUrlInput(e.target.value); setScrapeResults(null); setScrapeError(''); }}
                  placeholder="https://supplier-website.com/price-list"
                  className="flex-1 text-xs border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  onClick={handleScrape}
                  disabled={!urlInput.trim() || scraping}
                  className="px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0"
                >
                  {scraping ? <><span className="inline-block animate-spin">⏳</span> Fetching…</> : '🌐 Fetch & Parse'}
                </button>
              </div>
              {scrapeError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">
                  ⚠ {scrapeError}. Try the Paste method instead — copy the text from the page and paste it.
                </div>
              )}
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-600">
                <p className="font-semibold mb-0.5">Tip</p>
                <p>If scraping is blocked by the supplier's site, open the page in your browser, select all text (Cmd+A), copy, then use the <strong>Paste</strong> tab instead.</p>
              </div>
              {scrapeResults !== null && (
                <ParsePreview results={scrapeResults} latestPrices={latestPrices}
                  onEdit={(id, price) => setScrapeResults(p => p.map(i => i.catalogueId === id ? { ...i, unitPrice: price } : i))} />
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes (optional)</label>
            <input
              type="text" value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Quoted by Sales Manager — valid until end of June 2026"
              className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {itemCount} price{itemCount !== 1 ? 's' : ''} ready to log
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-xs border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button
              onClick={handleSave}
              disabled={itemCount === 0}
              className="px-5 py-2 bg-green-700 text-white text-xs font-semibold rounded-lg hover:bg-green-800 disabled:opacity-50 transition-colors"
            >
              💾 Save {itemCount > 0 ? itemCount : ''} Price{itemCount !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
