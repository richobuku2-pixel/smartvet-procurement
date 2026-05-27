/**
 * QuickLogPanel
 *
 * Inline panel (below a supplier card) for fast phone-call or in-person
 * availability check-ins and price logging.
 *
 * Modes:
 *   'checkin' — tap ✓ / ⚠ / ✕ buttons per product, then Save
 *   'price'   — type a UGX price per product, then Save
 *
 * Props:
 *   mode          — 'checkin' | 'price'
 *   supplierName  — string
 *   catalogue     — array of catalogue items
 *   currentUser   — { name?, email? }
 *   latestPrices  — { [catalogueId]: { price, date } } — for placeholder hints
 *   onSave        — fn(payload) — logAvailabilityCheck or logPriceUpdate
 *   onAdvanced    — fn() — switches to the full modal (paste / file / URL)
 *   onClose       — fn()
 */
import { useState, useMemo } from 'react';
import { STATUS_BTNS } from '../../constants';

export default function QuickLogPanel({ mode, supplierName, catalogue, currentUser, latestPrices, onSave, onAdvanced, onClose }) {
  const [statuses, setStatuses] = useState({});
  const [prices, setPrices]     = useState({});
  const [notes, setNotes]       = useState('');
  const [section, setSection]   = useState('all');

  // Collect unique sections from catalogue for the filter strip
  const sections = useMemo(() => {
    const seen = new Set();
    const out  = [];
    for (const item of catalogue) {
      const s = item.section || 'General';
      if (!seen.has(s)) { seen.add(s); out.push(s); }
    }
    return out;
  }, [catalogue]);

  const visibleItems = section === 'all'
    ? catalogue
    : catalogue.filter(i => (i.section || 'General') === section);

  const checkedCount = mode === 'checkin'
    ? Object.values(statuses).filter(Boolean).length
    : Object.entries(prices).filter(([, v]) => v && !isNaN(Number(v))).length;

  const handleSave = () => {
    if (mode === 'checkin') {
      const checks = Object.entries(statuses)
        .filter(([, s]) => s)
        .map(([id, status]) => {
          const item = catalogue.find(c => c.id === id);
          return { productId: id, productName: item?.name || id, status };
        });
      if (!checks.length) { alert('Tap a status for at least one product.'); return; }
      onSave({
        supplier:  supplierName,
        checks,
        checkedBy: currentUser?.name || currentUser?.email || 'Unknown',
        source:    'manual',
        notes,
      });
    } else {
      const items = Object.entries(prices)
        .filter(([, v]) => v && !isNaN(Number(v)) && Number(v) > 0)
        .map(([id, v]) => {
          const item = catalogue.find(c => c.id === id);
          return {
            catalogueId:  id,
            productName:  item?.name || id,
            unitPrice:    Number(v),
            currency:     'UGX',
            unit:         item?.unit || '',
          };
        });
      if (!items.length) { alert('Enter a price for at least one product.'); return; }
      onSave({
        supplier:   supplierName,
        items,
        recordedBy: currentUser?.name || currentUser?.email || 'Unknown',
        source:     'manual',
        notes,
      });
    }
    onClose();
  };

  return (
    <div className="border-t border-gray-100 bg-slate-50/60 px-5 py-4">

      {/* Panel header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">
            {mode === 'checkin' ? '📋 Quick Availability Check' : '💰 Quick Price Log'}
          </span>
          <span className="text-[10px] text-gray-400 font-medium">— {supplierName}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onAdvanced}
            className="text-xs text-teal-600 hover:text-teal-800 font-medium underline underline-offset-2">
            Advanced (paste/file/URL) →
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none ml-1">✕</button>
        </div>
      </div>

      {/* Section filter — only shown when catalogue has multiple sections */}
      {sections.length > 1 && (
        <div className="flex gap-1 flex-wrap mb-3">
          {['all', ...sections].map(s => (
            <button key={s} onClick={() => setSection(s)}
              className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors ${
                section === s
                  ? 'bg-teal-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-500 hover:border-teal-300'
              }`}>
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
      )}

      {/* Product list */}
      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
        {visibleItems.map(item => {
          const lastPrice = latestPrices?.[item.id]?.price;
          return (
            <div key={item.id}
              className="flex items-center gap-2 bg-white border border-gray-100 rounded-lg px-3 py-2 hover:border-gray-200 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">{item.name}</p>
                {item.unit && (
                  <p className="text-[10px] text-gray-400">
                    {item.unit}{lastPrice ? ` · last: UGX ${lastPrice.toLocaleString()}` : ''}
                  </p>
                )}
              </div>

              {mode === 'checkin' ? (
                <div className="flex gap-1 flex-shrink-0">
                  {STATUS_BTNS.map(btn => (
                    <button key={btn.value}
                      onClick={() => setStatuses(p => ({
                        ...p, [item.id]: p[item.id] === btn.value ? undefined : btn.value,
                      }))}
                      className={`w-7 h-7 rounded-md text-xs font-bold transition-colors ${
                        statuses[item.id] === btn.value ? btn.cls : btn.idleCls
                      }`}
                      title={btn.value.replace(/_/g, ' ')}>
                      {btn.icon}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[10px] text-gray-400">UGX</span>
                  <input
                    type="number"
                    value={prices[item.id] || ''}
                    onChange={e => setPrices(p => ({ ...p, [item.id]: e.target.value }))}
                    placeholder={lastPrice ? lastPrice.toLocaleString() : '0'}
                    className="w-24 text-xs border border-gray-200 rounded-md px-2 py-1 text-right outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-200"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer: notes + save */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
        <input
          type="text"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Add a note (optional)…"
          className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-teal-400"
        />
        <button
          onClick={handleSave}
          disabled={checkedCount === 0}
          className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-semibold rounded-lg transition-colors flex-shrink-0"
        >
          Save {checkedCount > 0 ? `(${checkedCount})` : ''}
        </button>
        <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0">
          Cancel
        </button>
      </div>
    </div>
  );
}
