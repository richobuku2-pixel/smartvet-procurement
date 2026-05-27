/**
 * purchase-order/Step2QuoteSheet.jsx
 *
 * Step 2 of the Purchase Order Wizard — quote sheet.
 * Displays the supplier's catalogue grouped by section, with Qty and
 * Unit Price inputs per product. Running totals are shown in the header.
 *
 * Props:
 *   supplierName    {string}   — selected supplier name
 *   supplierDetails {Object}   — supplier details from AppContext
 *   contactPerson   {string}   — contact person name for this call
 *   catalogue       {Array}    — supplier's product catalogue
 *   quotes          {Object}   — { [itemId]: { qty, unitPrice } }
 *   onQuoteChange   {Function} — called with (itemId, field, value) on input change
 *   onBack          {Function} — navigates back to Step 1
 *   onNext          {Function} — navigates to Step 3
 */

import { useState, useMemo } from 'react';

function PriorityBadge({ priority }) {
  if (priority === '★★★') return <span className="text-red-500 font-bold text-xs">★★★</span>;
  if (priority === '★★')  return <span className="text-amber-500 font-bold text-xs">★★</span>;
  return <span className="text-gray-300 text-xs">★</span>;
}

export default function Step2QuoteSheet({ supplierName, supplierDetails, contactPerson, catalogue, quotes, onQuoteChange, onBack, onNext }) {
  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState('all');

  const sections = useMemo(() => [...new Set(catalogue.map(i => i.section))], [catalogue]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return catalogue.filter(item => {
      const matchSection = sectionFilter === 'all' || item.section === sectionFilter;
      const matchSearch = !q
        || item.name.toLowerCase().includes(q)
        || (item.spec || '').toLowerCase().includes(q)
        || (item.indication || '').toLowerCase().includes(q);
      return matchSection && matchSearch;
    });
  }, [catalogue, search, sectionFilter]);

  // Group filtered items by section
  const grouped = useMemo(() => {
    const map = new Map();
    for (const item of filtered) {
      if (!map.has(item.section)) map.set(item.section, []);
      map.get(item.section).push(item);
    }
    return [...map.entries()];
  }, [filtered]);

  // Running totals
  const { lineCount, runningTotal } = useMemo(() => {
    let count = 0; let total = 0;
    for (const [id, q] of Object.entries(quotes)) {
      const qty = Number(q.qty) || 0;
      const price = Number(q.unitPrice) || 0;
      if (qty > 0) { count++; total += qty * price; }
    }
    return { lineCount: count, runningTotal: total };
  }, [quotes]);

  const handleQty = (id, val) => {
    const num = val === '' ? '' : Number(val);
    onQuoteChange(id, 'qty', num);
  };

  const handlePrice = (id, val) => {
    const num = val === '' ? '' : Number(val);
    onQuoteChange(id, 'unitPrice', num);
  };

  if (!catalogue.length) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
          <h3 className="text-base font-bold text-gray-900">Quote Sheet — {supplierName}</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-4xl mb-3">📂</p>
          <p className="font-medium text-gray-700">No catalogue yet for {supplierName}</p>
          <p className="text-sm text-gray-400 mt-2 max-w-sm">
            Add products to this supplier's catalogue from the <strong>Suppliers</strong> page,
            then come back here to create a purchase order.
          </p>
          <button onClick={onBack} className="mt-5 px-5 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            ← Choose Different Supplier
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0" style={{ maxHeight: '80vh' }}>
      {/* Header */}
      <div className="flex-shrink-0 space-y-3 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-700 font-medium">← Back</button>
            <div>
              <h3 className="text-base font-bold text-gray-900">{supplierName}</h3>
              {contactPerson && <p className="text-xs text-gray-400">Speaking with: <strong>{contactPerson}</strong></p>}
            </div>
          </div>
          {/* Running total */}
          <div className="text-right">
            <p className="text-xs text-gray-400">{lineCount} item{lineCount !== 1 ? 's' : ''} quoted</p>
            <p className="text-sm font-bold text-gray-900">UGX {runningTotal.toLocaleString()}</p>
          </div>
        </div>

        {/* Search + filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products…"
              className="w-full pl-7 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
          <select
            value={sectionFilter}
            onChange={e => setSectionFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-400 max-w-[180px]"
          >
            <option value="all">All Sections</option>
            {sections.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Column headers */}
      <div className="flex-shrink-0 grid grid-cols-[1fr_60px_110px_110px_90px] gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-semibold text-gray-500 uppercase tracking-wide">
        <span>Product</span>
        <span className="text-center">Unit</span>
        <span className="text-center">Qty</span>
        <span className="text-center">Unit Price (UGX)</span>
        <span className="text-right">Line Total</span>
      </div>

      {/* Scrollable items */}
      <div className="flex-1 overflow-y-auto space-y-0 min-h-0" style={{ maxHeight: 'calc(80vh - 260px)' }}>
        {grouped.length === 0 && (
          <div className="py-10 text-center text-sm text-gray-400">No products match your search.</div>
        )}

        {grouped.map(([section, items]) => {
          const hex = items[0]?.sectionColor || '2D5A2D';
          return (
            <div key={section}>
              {/* Section header */}
              <div
                className="px-3 py-2 text-white text-xs font-bold uppercase tracking-wider mt-2 rounded-lg"
                style={{ backgroundColor: `#${hex}` }}
              >
                {section}
              </div>

              {/* Product rows */}
              {items.map(item => {
                const q = quotes[item.id] || {};
                const qty   = Number(q.qty) || 0;
                const price = Number(q.unitPrice) || 0;
                const lineTotal = qty * price;
                const hasQty = qty > 0;

                return (
                  <div
                    key={item.id}
                    className={`grid grid-cols-[1fr_60px_110px_110px_90px] gap-1.5 items-center px-3 py-2 border-b border-gray-50 text-xs transition-colors ${
                      hasQty ? 'bg-green-50/60' : 'hover:bg-gray-50/50'
                    }`}
                  >
                    {/* Product info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <PriorityBadge priority={item.priority} />
                        <span className={`font-medium truncate ${hasQty ? 'text-green-900' : 'text-gray-800'}`}>
                          {item.name}
                        </span>
                      </div>
                      {item.spec && (
                        <p className="text-gray-400 text-xs mt-0.5 truncate">{item.spec}</p>
                      )}
                    </div>

                    {/* Unit */}
                    <span className="text-center text-gray-500">{item.unit || '—'}</span>

                    {/* Qty input */}
                    <input
                      type="number"
                      min="0"
                      value={q.qty ?? ''}
                      onChange={e => handleQty(item.id, e.target.value)}
                      placeholder="0"
                      className={`w-full text-center border rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-500 ${
                        hasQty ? 'border-green-300 bg-green-50 font-semibold text-green-800' : 'border-gray-200 bg-yellow-50'
                      }`}
                    />

                    {/* Price input */}
                    <input
                      type="number"
                      min="0"
                      value={q.unitPrice ?? ''}
                      onChange={e => handlePrice(item.id, e.target.value)}
                      placeholder="0"
                      className={`w-full text-center border rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-red-400 ${
                        hasQty && price > 0 ? 'border-red-200 bg-red-50 font-semibold' : 'border-gray-200 bg-red-50/30'
                      }`}
                    />

                    {/* Line total */}
                    <span className={`text-right font-mono ${hasQty && price > 0 ? 'text-gray-900 font-semibold' : 'text-gray-300'}`}>
                      {hasQty && price > 0 ? lineTotal.toLocaleString() : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer CTA */}
      <div className="flex-shrink-0 pt-3 border-t border-gray-100 flex items-center justify-between mt-3">
        <div className="text-sm text-gray-500">
          {lineCount > 0
            ? <span className="text-green-700 font-semibold">{lineCount} item{lineCount !== 1 ? 's' : ''} · UGX {runningTotal.toLocaleString()} subtotal</span>
            : <span className="text-gray-400">Enter quantities and prices as you speak to the supplier.</span>
          }
        </div>
        <button
          onClick={onNext}
          disabled={lineCount === 0}
          className="px-5 py-2.5 bg-red-900 text-white rounded-lg text-sm font-semibold hover:bg-red-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Generate PO ({lineCount} items) →
        </button>
      </div>
    </div>
  );
}
