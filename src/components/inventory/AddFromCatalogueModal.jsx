/**
 * inventory/AddFromCatalogueModal.jsx
 *
 * Full-screen modal that lets a user browse a supplier's catalogue and add
 * products to inventory with pricing and stock-threshold configuration.
 *
 * Props:
 *   suppliers        {Object}   — suppliersMap from AppContext
 *   existingProducts {Array}    — current inventory products (to detect duplicates)
 *   onAdd            {Function} — called with the new product data object
 *   onClose          {Function} — closes the modal
 */

import { useState, useMemo, useCallback } from 'react';
import { formatCurrency } from '../../utils/formatter';
import { PriorityBadge } from './helpers';

export default function AddFromCatalogueModal({ suppliers, existingProducts, onAdd, onClose }) {
  const [supplierName, setSupplierName]   = useState('');
  const [search, setSearch]               = useState('');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [selected, setSelected]           = useState(null);
  const [form, setForm] = useState({
    reorderPoint: 10, minStock: 5, initialStock: 0,
    landedCost: 0, wholesalePrice: 0, retailPrice: 0,
  });
  const [added, setAdded] = useState(new Set());
  const [error, setError] = useState('');

  const catalogue = useMemo(
    () => (supplierName ? (suppliers[supplierName]?.catalogue || []) : []),
    [supplierName, suppliers]
  );
  const sections = useMemo(() => [...new Set(catalogue.map(i => i.section))], [catalogue]);
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return catalogue.filter(item => {
      const matchSec = sectionFilter === 'all' || item.section === sectionFilter;
      const matchQ   = !q || item.name.toLowerCase().includes(q)
        || (item.spec || '').toLowerCase().includes(q)
        || (item.section || '').toLowerCase().includes(q);
      return matchSec && matchQ;
    });
  }, [catalogue, search, sectionFilter]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const item of filtered) {
      if (!map.has(item.section)) map.set(item.section, []);
      map.get(item.section).push(item);
    }
    return [...map.entries()];
  }, [filtered]);

  const alreadyInInventory = useCallback((item) =>
    existingProducts.some(p => p.name === item.name && p.supplier === supplierName),
  [existingProducts, supplierName]);

  const setNum = (k, v) => setForm(p => ({ ...p, [k]: v === '' ? '' : Number(v) }));

  const handleAdd = () => {
    if (!selected) return;
    if (form.landedCost <= 0) { setError('Landed cost must be greater than 0.'); return; }
    if (form.reorderPoint < 1) { setError('Reorder point must be at least 1.'); return; }
    setError('');
    onAdd({
      name: selected.name, supplier: supplierName,
      unit: selected.unit || 'Units', section: selected.section,
      spec: selected.spec || '',
      reorderPoint: Number(form.reorderPoint) || 10,
      minStock: Number(form.minStock) || 5,
      landedCost: Number(form.landedCost),
      wholesalePrice: Number(form.wholesalePrice) || 0,
      retailPrice: Number(form.retailPrice) || 0,
      initialStock: Number(form.initialStock) || 0,
    });
    setAdded(prev => new Set([...prev, selected.id]));
    setSelected(null);
    setForm({ reorderPoint: 10, minStock: 5, initialStock: 0, landedCost: 0, wholesalePrice: 0, retailPrice: 0 });
  };

  const fieldCls = 'w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500';
  const labelCls = 'block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-0.5';
  const margin   = form.landedCost > 0 && form.retailPrice > 0
    ? Math.round(((form.retailPrice - form.landedCost) / form.retailPrice) * 100) : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden">
        <div className="bg-gradient-to-r from-green-800 to-teal-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-white font-bold text-base">Add Products to Inventory</h3>
            <p className="text-green-200 text-xs mt-0.5">Select from supplier catalogue → set pricing & thresholds</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none">×</button>
        </div>

        <div className="flex-shrink-0 px-6 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Supplier</span>
            <select value={supplierName}
              onChange={e => { setSupplierName(e.target.value); setSelected(null); setSearch(''); setSectionFilter('all'); }}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-w-[220px]">
              <option value="">— Choose a supplier —</option>
              {Object.entries(suppliers).map(([name, d]) => (
                <option key={name} value={name}>{name} ({(d.catalogue || []).length} products)</option>
              ))}
            </select>
          </div>
          {supplierName && catalogue.length > 0 && (
            <>
              <div className="relative flex-1 min-w-[180px]">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…"
                  className="w-full pl-7 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <select value={sectionFilter} onChange={e => setSectionFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="all">All Sections</option>
                {sections.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <span className="text-xs text-gray-400 whitespace-nowrap">{filtered.length} product{filtered.length !== 1 ? 's' : ''}</span>
            </>
          )}
        </div>

        <div className="flex-1 flex min-h-0">
          <div className={`flex flex-col border-r border-gray-100 overflow-hidden transition-all ${selected ? 'w-[55%]' : 'w-full'}`}>
            {!supplierName ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 px-8">
                <p className="text-4xl mb-3">🏭</p>
                <p className="font-medium text-gray-600">Choose a supplier above</p>
                <p className="text-sm mt-1">Their product catalogue will appear here.</p>
              </div>
            ) : catalogue.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 px-8">
                <p className="text-4xl mb-3">📂</p>
                <p className="font-medium text-gray-600">No catalogue for {supplierName}</p>
                <p className="text-sm mt-1">Go to Suppliers → Catalogue tab to add products.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                {grouped.length === 0 ? (
                  <div className="py-12 text-center text-sm text-gray-400">No products match your search.</div>
                ) : grouped.map(([section, items]) => {
                  const hex = items[0]?.sectionColor || '1B4332';
                  return (
                    <div key={section}>
                      <div className="px-4 py-1.5 text-white text-[10px] font-bold uppercase tracking-wider sticky top-0 z-10"
                        style={{ backgroundColor: `#${hex}` }}>{section}</div>
                      {items.map(item => {
                        const inInventory = alreadyInInventory(item);
                        const wasAdded    = added.has(item.id);
                        const isSelected  = selected?.id === item.id;
                        return (
                          <button key={item.id}
                            onClick={() => !inInventory && !wasAdded && setSelected(item)}
                            disabled={inInventory || wasAdded}
                            className={`w-full text-left px-4 py-2.5 border-b border-gray-50 flex items-start gap-3 transition-colors text-xs ${
                              isSelected ? 'bg-green-50 border-l-2 border-l-green-600'
                              : inInventory || wasAdded ? 'bg-gray-50 opacity-50 cursor-not-allowed'
                              : 'hover:bg-teal-50/40 cursor-pointer'
                            }`}>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <PriorityBadge p={item.priority} />
                                <span className={`font-semibold truncate ${isSelected ? 'text-green-900' : 'text-gray-800'}`}>{item.name}</span>
                                {item.unit && <span className="text-gray-400 flex-shrink-0">· {item.unit}</span>}
                              </div>
                              {item.spec && <p className="text-gray-400 truncate mt-0.5 text-[10px]">{item.spec}</p>}
                            </div>
                            <div className="flex-shrink-0 text-right">
                              {wasAdded ? <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">✓ Added</span>
                                : inInventory ? <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">In inventory</span>
                                : isSelected ? <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">Selected →</span>
                                : <span className="text-[10px] text-gray-300">Select</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {selected && (
            <div className="w-[45%] flex flex-col overflow-y-auto">
              <div className="p-5 space-y-4">
                <div className="rounded-xl p-3 text-white text-xs" style={{ backgroundColor: `#${selected.sectionColor || '1B4332'}` }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-sm leading-snug">{selected.name}</p>
                      {selected.spec && <p className="text-white/70 mt-0.5 text-[10px]">{selected.spec}</p>}
                    </div>
                    <PriorityBadge p={selected.priority} />
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-white/60">
                    {selected.unit && <span>📦 {selected.unit}</span>}
                    <span>🏭 {supplierName}</span>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
                    <span>⚠️</span><span>{error}</span>
                  </div>
                )}

                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Stock Thresholds</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { k: 'reorderPoint', label: 'Reorder At *', hint: 'Trigger draft PO' },
                      { k: 'minStock',     label: 'Min Safe Stock', hint: 'Critical alert' },
                      { k: 'initialStock', label: 'Opening Stock',  hint: 'Qty on hand now' },
                    ].map(({ k, label, hint }) => (
                      <div key={k}>
                        <label className={labelCls}>{label}</label>
                        <input type="number" min="0" value={form[k]}
                          onChange={e => setNum(k, e.target.value)} className={fieldCls} />
                        <p className="text-[10px] text-gray-400 mt-0.5">{hint}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Pricing (UGX)</p>
                  <div className="space-y-2">
                    <div>
                      <label className={labelCls}>Landed Cost *</label>
                      <input type="number" min="0" value={form.landedCost}
                        onChange={e => setNum('landedCost', e.target.value)} className={fieldCls}
                        placeholder="Purchase / import cost per unit" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={labelCls}>Wholesale Price</label>
                        <input type="number" min="0" value={form.wholesalePrice}
                          onChange={e => setNum('wholesalePrice', e.target.value)} className={fieldCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Retail Price</label>
                        <input type="number" min="0" value={form.retailPrice}
                          onChange={e => setNum('retailPrice', e.target.value)} className={fieldCls} />
                      </div>
                    </div>
                    {margin !== null && (
                      <p className="text-xs text-green-700 font-medium bg-green-50 rounded px-2.5 py-1.5">
                        Retail margin: {margin}% · {formatCurrency(form.retailPrice - form.landedCost)} per {selected.unit || 'unit'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-auto px-5 py-4 border-t border-gray-100 bg-gray-50 flex gap-2">
                <button onClick={() => setSelected(null)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-600">← Back</button>
                <button onClick={handleAdd}
                  className="flex-1 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-lg text-sm font-bold">
                  ✓ Add to Inventory
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {added.size > 0
              ? <span className="text-green-700 font-semibold">✓ {added.size} product{added.size !== 1 ? 's' : ''} added this session</span>
              : 'Select a product from the list, then set pricing and click Add.'}
          </p>
          <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-900 font-medium">Done</button>
        </div>
      </div>
    </div>
  );
}
