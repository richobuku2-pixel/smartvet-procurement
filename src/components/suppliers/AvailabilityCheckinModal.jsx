/**
 * AvailabilityCheckinModal
 *
 * Modal for logging a supplier availability check-in.
 * Supports three entry modes:
 *   - Manual: dropdown per catalogue item
 *   - Paste: paste WhatsApp / email text → regex or AI parse
 *   - URL:   (coming soon) fetch supplier website
 */
import { useState } from 'react';
import { STATUS_OPTS } from '../../constants';

export default function AvailabilityCheckinModal({ supplierName, catalogue, currentUser, onSave, onClose }) {
  const [tier, setTier]               = useState('manual');
  const [statuses, setStatuses]       = useState({});
  const [itemNotes, setItemNotes]     = useState({});  // eslint-disable-line no-unused-vars
  const [checkinNotes, setCheckinNotes] = useState('');
  const [pasteText, setPasteText]     = useState('');
  const [parsedItems, setParsedItems] = useState(null);
  const [urlInput, setUrlInput]       = useState('');
  const [aiParsing, setAiParsing]     = useState(false);
  const [aiError, setAiError]         = useState('');
  const [parseSource, setParseSource] = useState(''); // 'regex' | 'ai'

  const setStatus = (id, val) => setStatuses(p => ({ ...p, [id]: val }));

  // ── Regex-based parse ────────────────────────────────────────────────────────
  const parsePaste = () => {
    setParseSource('regex');
    setAiError('');
    const lines = pasteText.split('\n').filter(l => l.trim());
    const parsed = [];
    for (const item of catalogue) {
      const keywords = item.name.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const matchLine = lines.find(l => {
        const ll = l.toLowerCase();
        return keywords.some(kw => ll.includes(kw));
      });
      if (!matchLine) continue;
      const ll = matchLine.toLowerCase();
      let status = 'in_stock';
      if (/out of stock|not available|unavailable|0 units|nil\b/.test(ll)) status = 'out_of_stock';
      else if (/low stock|limited|few left|running low/.test(ll)) status = 'low_stock';
      parsed.push({ id: item.id, name: item.name, status, matchLine });
    }
    setParsedItems(parsed);
  };

  // ── Gemini AI parse ──────────────────────────────────────────────────────────
  const handleAiParse = async () => {
    setAiParsing(true);
    setAiError('');
    setParseSource('ai');
    setParsedItems(null);
    try {
      const res = await fetch('/api/parse-prices-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: pasteText,
          catalogue: catalogue.map(i => ({ id: i.id, name: i.name, unit: i.unit })),
          mode: 'availability',
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setAiError(data.error || 'AI parse failed');
        setAiParsing(false);
        return;
      }
      const mapped = (data.items || []).map(item => {
        const cat = catalogue.find(c => c.id === item.productId);
        if (!cat) return null;
        return { id: cat.id, name: cat.name, status: item.status || 'in_stock', matchLine: '🤖 AI matched' };
      }).filter(Boolean);
      setParsedItems(mapped);
    } catch (err) {
      setAiError(err.message);
    }
    setAiParsing(false);
  };

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = () => {
    let checks = [];
    if (tier === 'manual') {
      checks = catalogue
        .filter(item => statuses[item.id] && statuses[item.id] !== 'skip')
        .map(item => ({
          productId: item.id,
          productName: item.name,
          status: statuses[item.id],
          notes: itemNotes[item.id] || '',
        }));
    } else if (tier === 'paste' && parsedItems) {
      checks = parsedItems.map(p => ({
        productId: p.id, productName: p.name, status: p.status, notes: '',
      }));
    }
    if (checks.length === 0) { alert('No products selected for logging.'); return; }
    onSave({
      supplier:   supplierName,
      checks,
      checkedBy:  currentUser?.name || currentUser?.email || 'Unknown',
      source:     tier === 'url' ? 'url_scrape' : tier === 'paste' ? 'paste' : 'manual',
      notes:      checkinNotes,
    });
    onClose();
  };

  const checkedCount = tier === 'manual'
    ? Object.values(statuses).filter(s => s && s !== 'skip').length
    : (parsedItems?.length || 0);

  const TIERS = [
    { key: 'manual', label: '📋 Manual Entry',    desc: 'Select products & set status' },
    { key: 'paste',  label: '📄 Paste Price List', desc: 'Paste email or WhatsApp text' },
    { key: 'url',    label: '🌐 URL / Scrape',     desc: 'Fetch from supplier website'  },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-14">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-700 to-teal-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {supplierName.charAt(0)}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">Log Availability Check-in</p>
            <p className="text-xs text-gray-400">{supplierName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-lg leading-none">✕</button>
        </div>

        {/* Tier selector */}
        <div className="flex gap-1.5 px-5 pt-3 pb-1">
          {TIERS.map(t => (
            <button key={t.key} onClick={() => setTier(t.key)}
              className={`flex-1 px-3 py-2 rounded-lg text-left transition-colors ${
                tier === t.key ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              <div className="text-xs font-semibold">{t.label}</div>
              <div className={`text-[10px] mt-0.5 ${tier === t.key ? 'text-teal-100' : 'text-gray-400'}`}>{t.desc}</div>
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">

          {/* ── Manual ── */}
          {tier === 'manual' && (
            <>
              <p className="text-xs text-gray-500">
                Set the current status for each product. "Skip" means it won't be recorded in this check-in.
              </p>
              {catalogue.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  No catalogue items yet. Add products to this supplier's catalogue first.
                </p>
              ) : (
                <div className="space-y-1">
                  {catalogue.map(item => (
                    <div key={item.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">{item.name}</p>
                        {item.section && <p className="text-[10px] text-gray-400">{item.section}</p>}
                      </div>
                      <select
                        value={statuses[item.id] || 'skip'}
                        onChange={e => setStatus(item.id, e.target.value)}
                        className={`text-xs border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500 flex-shrink-0 ${
                          !statuses[item.id] || statuses[item.id] === 'skip'
                            ? 'text-gray-400 border-gray-200 bg-white'
                            : statuses[item.id] === 'in_stock'
                              ? 'text-green-700 border-green-200 bg-green-50'
                              : statuses[item.id] === 'low_stock'
                                ? 'text-amber-600 border-amber-200 bg-amber-50'
                                : 'text-red-600 border-red-200 bg-red-50'
                        }`}
                      >
                        {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Paste ── */}
          {tier === 'paste' && (
            <>
              <p className="text-xs text-gray-500">
                Paste a price list, email, or WhatsApp availability update.
                SmartVet will scan for known product names and infer their status.
              </p>
              <textarea
                value={pasteText}
                onChange={e => {
                  setPasteText(e.target.value);
                  setParsedItems(null);
                  setAiError('');
                  setParseSource('');
                }}
                placeholder={"Paste price list or availability update here...\n\nExample:\nNewcastle Vaccine — In Stock — UGX 85,000\nGumboro Live — Out of Stock\nAmprolium 20% — Limited stock, 50 units left"}
                rows={7}
                className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono resize-none"
              />
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={parsePaste}
                  disabled={!pasteText.trim()}
                  className="px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-50"
                >
                  🔍 Regex Parse
                </button>
                <button
                  onClick={handleAiParse}
                  disabled={!pasteText.trim() || aiParsing}
                  className="px-4 py-2 bg-violet-600 text-white text-xs font-semibold rounded-lg hover:bg-violet-700 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {aiParsing
                    ? <><span className="animate-spin inline-block text-sm">⟳</span> Parsing…</>
                    : '🤖 AI Parse'
                  }
                </button>
                {parseSource && parsedItems !== null && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    parseSource === 'ai' ? 'bg-violet-50 text-violet-600' : 'bg-teal-50 text-teal-600'
                  }`}>
                    {parseSource === 'ai' ? '🤖 Gemini 2.5 Flash' : '🔍 Regex'}
                  </span>
                )}
              </div>
              {aiError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                  <p className="font-semibold">AI Parse Error</p>
                  <p>{aiError}</p>
                  {aiError.includes('GEMINI_API_KEY') && (
                    <p className="mt-1 text-red-500">
                      Add <code className="bg-red-100 px-1 rounded">GEMINI_API_KEY=your_key</code> to your <code>.env</code> file.
                    </p>
                  )}
                </div>
              )}
              {parsedItems !== null && (
                <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                  <p className="text-xs font-semibold text-gray-600 mb-2">
                    {parsedItems.length === 0
                      ? 'No matches found.'
                      : `${parsedItems.length} product${parsedItems.length !== 1 ? 's' : ''} detected:`}
                  </p>
                  {parsedItems.length === 0
                    ? <p className="text-xs text-gray-400">Try adjusting the paste text or switch to Manual Entry.</p>
                    : parsedItems.map(p => (
                      <div key={p.id} className="flex items-start gap-2 text-xs">
                        <span className={`flex-shrink-0 font-bold ${
                          p.status === 'in_stock' ? 'text-green-600'
                          : p.status === 'low_stock' ? 'text-amber-500'
                          : 'text-red-500'
                        }`}>
                          {p.status === 'in_stock' ? '✓' : p.status === 'low_stock' ? '⚠' : '✕'}
                        </span>
                        <span className="font-medium text-gray-800 flex-shrink-0">{p.name}</span>
                        <span className="text-gray-400 truncate">{p.matchLine}</span>
                      </div>
                    ))
                  }
                </div>
              )}
            </>
          )}

          {/* ── URL ── */}
          {tier === 'url' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                Enter the URL of the supplier's price list or website.
                SmartVet will fetch and scan the page for product availability.
              </p>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="https://supplier-website.com/pricelist"
                  className="flex-1 text-xs border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button disabled className="px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-lg opacity-50 cursor-not-allowed">
                  🌐 Fetch
                </button>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-700">
                <p className="font-semibold mb-0.5">🚧 Coming soon</p>
                <p>Automated URL scraping is being set up. Use <strong>Paste Price List</strong> or <strong>Manual Entry</strong> in the meantime.</p>
              </div>
            </div>
          )}

          {/* Check-in notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Check-in Notes (optional)
            </label>
            <input
              type="text"
              value={checkinNotes}
              onChange={e => setCheckinNotes(e.target.value)}
              placeholder="e.g. Spoke with Sales Team — prices valid until end of month"
              className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {checkedCount} product{checkedCount !== 1 ? 's' : ''} will be logged
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-xs border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={checkedCount === 0}
              className="px-5 py-2 bg-green-700 text-white text-xs font-semibold rounded-lg hover:bg-green-800 disabled:opacity-50 transition-colors"
            >
              ✓ Save Check-in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
