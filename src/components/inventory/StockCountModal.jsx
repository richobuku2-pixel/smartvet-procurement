/**
 * inventory/StockCountModal.jsx
 *
 * Modal for recording a physical stock count. Supports three input modes:
 *   - Manual Entry — type quantities per product in a table
 *   - POS API      — fetch live stock data from an external POS endpoint
 *   - Paste CSV    — paste product/quantity data from a spreadsheet or report
 *
 * Props:
 *   currentInventory  {Object}   — current {productId: qty} map
 *   products          {Array}    — full product list from AppContext
 *   posApiUrl         {string}   — saved POS base URL
 *   onPosApiUrlChange {Function} — called when the user edits the POS URL
 *   onSave            {Function} — called with { counts, countedBy, notes, source }
 *   onClose           {Function} — closes the modal without saving
 *   currentUser       {Object}   — logged-in user (for pre-filling "counted by")
 */

import { useState } from 'react';
import { matchProduct, parsePasteData, downloadTemplate, VARIANCE_CLS } from './helpers';

export default function StockCountModal({ currentInventory, products, posApiUrl: initPosUrl, onPosApiUrlChange, onSave, onClose, currentUser }) {
  const [mode, setMode]           = useState('manual');   // 'manual' | 'api' | 'paste'
  const [counts, setCounts]       = useState(() =>
    Object.fromEntries(products.map(p => [p.id, currentInventory[p.id] ?? 0]))
  );
  const [notes, setNotes]         = useState('');
  const [countedBy, setCountedBy] = useState(currentUser?.name || '');
  // API mode
  const [posUrl, setPosUrl]       = useState(initPosUrl || '');
  const [fetching, setFetching]   = useState(false);
  const [fetchMsg, setFetchMsg]   = useState('');
  // Paste mode
  const [raw, setRaw]             = useState('');
  const [pasteMsg, setPasteMsg]   = useState('');

  const setCount = (id, val) => {
    const n = parseInt(val, 10);
    setCounts(c => ({ ...c, [id]: isNaN(n) || n < 0 ? 0 : n }));
  };

  const handleFetchFromAPI = async () => {
    if (!posUrl.trim()) return;
    setFetching(true); setFetchMsg('');
    try {
      const base = posUrl.replace(/\/$/, '');
      const res  = await fetch(`${base}/api/stock`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json(); // [{name, qty}] or [{id, qty}]
      let matched = 0;
      const next = { ...counts };
      data.forEach(row => {
        const qty = parseInt(row.qty ?? row.quantity, 10);
        if (isNaN(qty)) return;
        if (row.id != null) {
          const p = products.find(p => p.id === row.id || String(p.id) === String(row.id));
          if (p) { next[p.id] = qty; matched++; }
        } else if (row.name) {
          const p = matchProduct(row.name, products);
          if (p) { next[p.id] = qty; matched++; }
        }
      });
      setCounts(next);
      setFetchMsg(`✓ Fetched ${data.length} items, matched ${matched} products.`);
      setMode('manual');
    } catch (err) {
      setFetchMsg(`⚠️ ${err.message}`);
    } finally {
      setFetching(false);
    }
  };

  const handlePasteParse = () => {
    const rows = parsePasteData(raw);
    let matched = 0;
    const next = { ...counts };
    rows.forEach(({ name, qty }) => {
      const p = matchProduct(name, products);
      if (p) { next[p.id] = qty; matched++; }
    });
    setCounts(next);
    setPasteMsg(`✓ ${rows.length} lines parsed, ${matched} matched.`);
    setMode('manual');
  };

  const handleSave = () => {
    if (posUrl !== initPosUrl) onPosApiUrlChange?.(posUrl);
    onSave({ counts, countedBy, notes, source: mode });
  };

  const totalItems   = products.length;
  const changedItems = products.filter(p => counts[p.id] !== (currentInventory[p.id] ?? 0)).length;
  const reorderItems = products.filter(p => counts[p.id] < p.reorderPoint).length;

  const TAB = 'px-4 py-2 text-sm font-medium rounded-lg transition-colors';
  const ACTIVE = `${TAB} bg-green-700 text-white`;
  const INACTIVE = `${TAB} text-gray-500 hover:bg-gray-100`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-green-800 to-teal-700 px-6 py-4 rounded-t-2xl flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-white font-bold text-base">Record Stock Count</h3>
            <p className="text-green-200 text-xs mt-0.5">Enter physical quantities — system will update and flag reorders</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none">×</button>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-2 px-6 pt-4 pb-2 border-b border-gray-100 flex-shrink-0">
          <button className={mode === 'manual' ? ACTIVE : INACTIVE} onClick={() => setMode('manual')}>✏️ Manual Entry</button>
          <button className={mode === 'api'    ? ACTIVE : INACTIVE} onClick={() => setMode('api')}>🔌 POS API</button>
          <button className={mode === 'paste'  ? ACTIVE : INACTIVE} onClick={() => setMode('paste')}>📋 Paste CSV</button>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* POS API tab */}
          {mode === 'api' && (
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                If your POS exposes <code className="bg-gray-100 px-1 rounded text-xs">GET /api/stock</code> returning
                <code className="bg-gray-100 px-1 rounded text-xs ml-1">[&#123;name, qty&#125;]</code>,
                enter its base URL below. Stock counts will pre-fill automatically.
              </p>
              <div className="flex gap-2">
                <input
                  type="url" value={posUrl} onChange={e => setPosUrl(e.target.value)}
                  placeholder="https://your-pos.vercel.app"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button onClick={handleFetchFromAPI} disabled={fetching || !posUrl.trim()}
                  className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-semibold hover:bg-green-800 disabled:opacity-40 whitespace-nowrap">
                  {fetching ? 'Fetching…' : 'Fetch Stock'}
                </button>
              </div>
              {fetchMsg && (
                <p className={`text-sm ${fetchMsg.startsWith('✓') ? 'text-green-700' : 'text-red-600'}`}>{fetchMsg}</p>
              )}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                <strong>Don't have an API yet?</strong> Add a <code>GET /api/stock</code> endpoint to your POS that returns
                product names and quantities. Switch to <strong>Manual Entry</strong> or <strong>Paste CSV</strong> for now.
              </div>
            </div>
          )}

          {/* Paste CSV tab */}
          {mode === 'paste' && (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-800">Paste stock data (CSV, tab, or colon separated)</p>
                <button onClick={() => downloadTemplate(products)} className="text-xs text-teal-700 hover:underline">↓ Download template</button>
              </div>
              <textarea value={raw} onChange={e => { setRaw(e.target.value); setPasteMsg(''); }}
                placeholder={"Newcastle Disease Vaccine, 12\nEnrofloxacin, 8"}
                rows={8} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              {pasteMsg && <p className="text-sm text-green-700">{pasteMsg}</p>}
              <button onClick={handlePasteParse} disabled={!raw.trim()}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-semibold hover:bg-gray-900 disabled:opacity-40">
                Import into Count Sheet
              </button>
            </div>
          )}

          {/* Manual entry table (default + after import) */}
          {mode === 'manual' && (
            <div className="px-6 pt-4 pb-2">
              {(fetchMsg || pasteMsg) && (
                <div className="mb-3 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
                  {fetchMsg || pasteMsg} — Review counts below and adjust if needed.
                </div>
              )}
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm min-w-[480px]">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
                      <th className="px-3 py-2 text-left">Product</th>
                      <th className="px-3 py-2 text-center w-20">System</th>
                      <th className="px-3 py-2 text-center w-24">Count</th>
                      <th className="px-3 py-2 text-center w-16">Δ</th>
                      <th className="px-3 py-2 text-center w-16">Reorder</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.map(p => {
                      const sys  = currentInventory[p.id] ?? 0;
                      const cnt  = counts[p.id] ?? 0;
                      const diff = cnt - sys;
                      const needsReorder = cnt < p.reorderPoint;
                      return (
                        <tr key={p.id} className={needsReorder ? 'bg-red-50/40' : ''}>
                          <td className="px-3 py-1.5 font-medium text-gray-800 text-xs">{p.name}</td>
                          <td className="px-3 py-1.5 text-center font-mono text-gray-400 text-xs">{sys}</td>
                          <td className="px-3 py-1.5 text-center">
                            <input
                              type="number" min="0" value={cnt}
                              onChange={e => setCount(p.id, e.target.value)}
                              className="w-20 border border-gray-300 rounded px-2 py-1 text-xs text-center font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </td>
                          <td className={`px-3 py-1.5 text-center font-mono text-xs ${VARIANCE_CLS(diff)}`}>
                            {diff === 0 ? '—' : diff > 0 ? `+${diff}` : diff}
                          </td>
                          <td className="px-3 py-1.5 text-center">
                            {needsReorder
                              ? <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold">⚠ Reorder</span>
                              : <span className="text-[10px] text-gray-300">✓</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex-shrink-0 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Counted by</label>
              <input value={countedBy} onChange={e => setCountedBy(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Notes (optional)</label>
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. End of day count"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex gap-3 text-xs text-gray-500">
              <span>{totalItems} products</span>
              {changedItems > 0 && <span className="text-teal-700 font-medium">{changedItems} changed</span>}
              {reorderItems > 0 && <span className="text-red-600 font-medium">⚠ {reorderItems} need reorder</span>}
            </div>
            <div className="flex gap-2">
              <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">Cancel</button>
              <button onClick={handleSave} disabled={!countedBy.trim()}
                className="px-5 py-2 bg-green-700 text-white rounded-lg text-sm font-semibold hover:bg-green-800 disabled:opacity-40">
                Save Count
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
