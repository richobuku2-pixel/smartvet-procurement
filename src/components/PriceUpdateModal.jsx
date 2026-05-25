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
    .replace(/[^a-z0-9%\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w));
}

function extractPrice(line) {
  // Patterns tried in order of specificity:
  const patterns = [
    /ugx\s*([\d,]+)/i,                    // UGX 85,000
    /shs?\.?\s*([\d,]+)/i,                // Shs 85,000  /  Sh.85000
    /([\d,]+)\s*\/=/,                     // 85,000/=
    /([\d,]+)\s*ugx/i,                    // 85000 UGX
    /(?<![.\d])([\d,]{4,})(?![.\d%])/,   // bare 4+ digit number (no decimals/percents)
  ];
  for (const pat of patterns) {
    const m = line.match(pat);
    if (m) {
      const raw = m[1].replace(/,/g, '');
      // Handle shorthand: "85K" → 85000
      const n = raw.endsWith('k') || raw.endsWith('K')
        ? parseFloat(raw) * 1000
        : parseInt(raw, 10);
      if (n >= 500 && n <= 100_000_000) return n; // UGX 500 → 100M sanity range
    }
  }
  return null;
}

function parsePriceText(text, catalogue) {
  const lines = text.split('\n').filter(l => l.trim());
  const results = [];
  for (const item of catalogue) {
    const itemTokens = tokenise(item.name);
    if (!itemTokens.length) continue;

    let bestLine = null, bestScore = 0;
    for (const line of lines) {
      const lineTokens = new Set(tokenise(line));
      // Partial substring matching — "Newcastle" matches "newcastle" in line
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

  // Parse paste
  const handleParsePaste = () => setParsedPaste(parsePriceText(pasteText, catalogue));

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
                Paste a WhatsApp message, email, or plain text price list. SmartVet matches product names and extracts UGX amounts automatically.
              </p>
              <textarea
                value={pasteText}
                onChange={e => { setPasteText(e.target.value); setParsedPaste(null); }}
                placeholder={"Paste here...\n\nExample:\nNewcastle Vaccine (I2) — UGX 85,000\nGumboro Live 100,000/=\nEnrofloxacin 10% — Shs. 45,000\nAmprolium 20% 90,000 per ltr\nGlucovit — 35,000/bottle"}
                rows={7}
                className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono resize-none"
              />
              <button
                onClick={handleParsePaste}
                disabled={!pasteText.trim()}
                className="px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                🔍 Parse &amp; Preview
              </button>
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
