import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { getStockStatus } from '../utils/calculations';
import { formatCurrency, formatDateTime } from '../utils/formatter';

const UNITS = ['Units', 'Bottles', 'Liters', 'kg', 'Tablets', 'Vials', 'Packs', 'Doses', 'Sachets', 'Boxes', 'Tins'];

// ─── Priority badge ────────────────────────────────────────────────────────────
function PriorityBadge({ p }) {
  if (p === '★★★') return <span className="text-red-500 font-bold text-[10px] leading-none">★★★</span>;
  if (p === '★★')  return <span className="text-amber-500 font-bold text-[10px] leading-none">★★</span>;
  return <span className="text-gray-300 text-[10px] leading-none">★</span>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADD FROM CATALOGUE MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function AddFromCatalogueModal({ suppliers, existingProducts, onAdd, onClose }) {
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


// ═══════════════════════════════════════════════════════════════════════════════
// EDIT PRODUCT MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function EditProductModal({ product, suppliers, onSubmit, onClose }) {
  const [form, setForm] = useState({
    supplier:       product.supplier       || '',
    unit:           product.unit           || 'Units',
    reorderPoint:   product.reorderPoint   ?? 10,
    minStock:       product.minStock       ?? 5,
    landedCost:     product.landedCost     ?? 0,
    wholesalePrice: product.wholesalePrice ?? 0,
    retailPrice:    product.retailPrice    ?? 0,
  });
  const [error, setError] = useState('');

  const set    = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setNum = (k, v) => setForm(p => ({ ...p, [k]: v === '' ? '' : Number(v) }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.landedCost <= 0)  { setError('Landed cost must be greater than 0.'); return; }
    if (form.reorderPoint < 1) { setError('Reorder point must be at least 1.'); return; }
    setError('');
    onSubmit({ ...form });
  };

  const fieldCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500';
  const labelCls = 'block text-xs font-semibold text-gray-500 uppercase mb-1';
  const margin   = form.landedCost > 0 && form.retailPrice > 0
    ? Math.round(((form.retailPrice - form.landedCost) / form.retailPrice) * 100) : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col">
        <div className="bg-gradient-to-r from-green-800 to-teal-700 px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-base truncate max-w-xs">{product.name}</h3>
            <p className="text-green-200 text-xs mt-0.5">{product.supplier} · Edit pricing & thresholds</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg flex items-center gap-2">
              <span>⚠️</span><span>{error}</span>
            </div>
          )}
          <div className="bg-gray-50 rounded-lg px-4 py-3">
            <p className="font-semibold text-gray-800 text-sm">{product.name}</p>
            {product.spec && <p className="text-xs text-gray-400 mt-0.5 truncate">{product.spec}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Supplier</label>
              <select value={form.supplier} onChange={e => set('supplier', e.target.value)} className={fieldCls}>
                {Object.keys(suppliers).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Unit</label>
              <select value={form.unit} onChange={e => set('unit', e.target.value)} className={fieldCls}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Stock Thresholds</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Reorder Point *</label>
                <input type="number" min="1" value={form.reorderPoint}
                  onChange={e => setNum('reorderPoint', e.target.value)} className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Min Safe Stock</label>
                <input type="number" min="0" value={form.minStock}
                  onChange={e => setNum('minStock', e.target.value)} className={fieldCls} />
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Pricing (UGX)</p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { k: 'landedCost', label: 'Landed Cost *' },
                { k: 'wholesalePrice', label: 'Wholesale' },
                { k: 'retailPrice', label: 'Retail' },
              ].map(({ k, label }) => (
                <div key={k}>
                  <label className={labelCls}>{label}</label>
                  <input type="number" min="0" value={form[k]}
                    onChange={e => setNum(k, e.target.value)} className={fieldCls} />
                </div>
              ))}
            </div>
            {margin !== null && (
              <p className="text-xs text-green-700 mt-2 font-medium">
                Retail margin: {margin}% · {formatCurrency(form.retailPrice - form.landedCost)} per {form.unit}
              </p>
            )}
          </div>
        </form>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-between bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">Cancel</button>
          <button onClick={handleSubmit}
            className="px-6 py-2.5 bg-green-700 text-white rounded-lg text-sm font-semibold hover:bg-green-800">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── Helpers ───────────────────────────────────────────────────────────────────
const STATUS = {
  ok:       { label: 'OK',       dot: 'bg-green-500',  badge: 'bg-green-100 text-green-700',  row: '',              input: 'border-gray-200 bg-white text-gray-900 focus:ring-green-400' },
  low:      { label: 'Low',      dot: 'bg-amber-400',  badge: 'bg-amber-100 text-amber-700',  row: 'bg-amber-50/40', input: 'border-amber-300 bg-amber-50 text-amber-800 focus:ring-amber-400' },
  critical: { label: 'Critical', dot: 'bg-red-500',    badge: 'bg-red-100 text-red-700',      row: 'bg-red-50/50',  input: 'border-red-300 bg-red-50 text-red-800 focus:ring-red-400' },
};

function StockBar({ current, reorderPoint, minStock }) {
  const max = Math.max(reorderPoint * 2, current + 5, 1);
  const pct = Math.min(100, Math.round((current / max) * 100));
  const st  = current <= minStock ? 'critical' : current <= reorderPoint ? 'low' : 'ok';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden min-w-[60px]">
        <div className={`h-full rounded-full ${STATUS[st].dot}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-gray-400 font-mono w-7 text-right">{pct}%</span>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// SUPPLIER SECTION — collapsible table, inline stock editing
// ═══════════════════════════════════════════════════════════════════════════════
function SupplierSection({ supplier, supplierDetails, products, localInventory, onChange, errors, editMode, sortField, sortDir, onEdit, onDelete, canManage }) {
  const [collapsed, setCollapsed] = useState(false);

  const sorted = [...products].sort((a, b) => {
    if (!sortField) return 0;
    if (sortField === 'name')   return sortDir * a.name.localeCompare(b.name);
    if (sortField === 'stock')  return sortDir * ((localInventory[a.id] ?? 0) - (localInventory[b.id] ?? 0));
    if (sortField === 'status') {
      const order = { critical: 0, low: 1, ok: 2 };
      return sortDir * (order[getStockStatus(a, localInventory[a.id] ?? 0)] - order[getStockStatus(b, localInventory[b.id] ?? 0)]);
    }
    return 0;
  });

  const totalValue = products.reduce((s, p) => {
    const q = isNaN(Number(localInventory[p.id])) ? 0 : Number(localInventory[p.id]);
    return s + q * p.landedCost;
  }, 0);
  const alertCount = products.filter(p => getStockStatus(p, localInventory[p.id] ?? 0) !== 'ok').length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

      {/* ── Supplier header ──────────────────────────────────────────── */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-green-800 to-teal-700 text-white hover:from-green-900 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-mono text-xs opacity-70">{collapsed ? '▶' : '▼'}</span>
          <div className="text-left min-w-0">
            <p className="font-bold text-sm">{supplier}</p>
            <p className="text-green-200 text-xs truncate">
              {supplierDetails?.contactEmail || '—'}
              {supplierDetails?.minimumOrderQuantity ? ` · MOQ: ${supplierDetails.minimumOrderQuantity}` : ''}
              {supplierDetails?.leadTimeDays ? ` · Lead: ${supplierDetails.leadTimeDays}d` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {alertCount > 0 && (
            <span className="bg-red-500/80 text-white text-xs px-2.5 py-0.5 rounded-full font-semibold">
              {alertCount} alert{alertCount !== 1 ? 's' : ''}
            </span>
          )}
          <div className="text-right">
            <p className="text-[10px] text-green-200 uppercase tracking-wide">Stock value</p>
            <p className="font-mono font-bold text-sm">{formatCurrency(totalValue)}</p>
          </div>
        </div>
      </button>

      {/* ── Product table ─────────────────────────────────────────────── */}
      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-100 bg-gray-50/80">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Product</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide w-24">Status</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide w-36">
                  Current Stock {editMode && <span className="normal-case text-teal-500 font-normal">(editing)</span>}
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide w-40">Level</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide w-28">Thresholds</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide w-28">Unit Cost</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide w-28">Stock Value</th>
                {canManage && <th className="px-3 py-2.5 w-20" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map(product => {
                const rawStock   = localInventory[product.id] ?? '';
                const stock      = rawStock === '' ? 0 : Number(rawStock);
                const status     = getStockStatus(product, stock);
                const cfg        = STATUS[status];
                const hasError   = !!errors[product.id];
                const stockValue = (isNaN(stock) ? 0 : stock) * product.landedCost;

                return (
                  <tr key={product.id} className={`group transition-colors hover:bg-gray-50/60 ${cfg.row}`}>

                    {/* Product */}
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800 leading-snug">{product.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {product.unit}
                        {product.section && <span className="ml-1.5 text-gray-300">· {product.section}</span>}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} flex-shrink-0`} />
                        {cfg.label}
                      </span>
                    </td>

                    {/* Stock cell — editable in edit mode, read-only otherwise */}
                    <td className="px-3 py-3 text-center">
                      {editMode ? (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={rawStock}
                            onChange={e => onChange(product.id, e.target.value)}
                            className={`w-20 text-center border-2 rounded-lg px-2 py-1.5 text-base font-bold font-mono focus:outline-none focus:ring-2 transition-colors ${
                              hasError ? 'border-red-400 bg-red-50 text-red-700 focus:ring-red-400' : cfg.input
                            }`}
                          />
                          <span className="text-[10px] text-gray-400 leading-tight max-w-[30px]">{product.unit}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <span className={`text-xl font-bold font-mono ${
                            status === 'critical' ? 'text-red-600' : status === 'low' ? 'text-amber-600' : 'text-gray-800'
                          }`}>{stock}</span>
                          <span className="text-[10px] text-gray-400">{product.unit}</span>
                        </div>
                      )}
                      {hasError && <p className="text-[10px] text-red-500 mt-1">Invalid value</p>}
                    </td>

                    {/* Level bar */}
                    <td className="px-3 py-3">
                      <StockBar current={isNaN(stock) ? 0 : stock} reorderPoint={product.reorderPoint} minStock={product.minStock} />
                    </td>

                    {/* Thresholds */}
                    <td className="px-3 py-3 text-center">
                      <div className="space-y-0.5">
                        <p className="text-xs text-gray-500">
                          <span className="text-amber-600 font-semibold">Reorder:</span> {product.reorderPoint}
                        </p>
                        <p className="text-xs text-gray-500">
                          <span className="text-red-500 font-semibold">Min:</span> {product.minStock}
                        </p>
                      </div>
                    </td>

                    {/* Unit cost */}
                    <td className="px-3 py-3 text-right">
                      <p className="font-mono text-sm text-gray-700">{formatCurrency(product.landedCost)}</p>
                      <p className="text-[10px] text-gray-400">per {(product.unit || 'unit').toLowerCase()}</p>
                    </td>

                    {/* Stock value */}
                    <td className="px-3 py-3 text-right">
                      <p className="font-mono text-sm font-semibold text-gray-800">{formatCurrency(stockValue)}</p>
                    </td>

                    {/* Actions */}
                    {canManage && (
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => onEdit(product)}
                            className="p-1.5 rounded-md text-teal-600 hover:bg-teal-50 transition-colors" title="Edit product">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6.768-6.768a2 2 0 112.828 2.828L11.828 13.83a4 4 0 01-1.414.93l-3.414 1.138 1.138-3.414a4 4 0 01.93-1.414z" />
                            </svg>
                          </button>
                          <button onClick={() => onDelete(product)}
                            className="p-1.5 rounded-md text-red-400 hover:bg-red-50 transition-colors" title="Remove product">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>

            {/* Section subtotal */}
            <tfoot>
              <tr className="border-t-2 border-gray-100 bg-gray-50/60">
                <td colSpan={canManage ? 6 : 5} className="px-4 py-2.5 text-xs text-gray-400 font-medium">
                  {products.length} product{products.length !== 1 ? 's' : ''} · {supplier}
                </td>
                <td className="px-3 py-2.5 text-right font-mono font-bold text-gray-700 text-sm">
                  {formatCurrency(totalValue)}
                </td>
                {canManage && <td />}
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}


// ─── Stock Count helpers ───────────────────────────────────────────────────────
function matchProduct(posName, products) {
  const needle = posName.toLowerCase().trim();
  let match = products.find(p => p.name.toLowerCase() === needle);
  if (match) return match;
  match = products.find(p => p.name.toLowerCase().includes(needle));
  if (match) return match;
  return products.find(p => needle.includes(p.name.toLowerCase())) || null;
}

function parsePasteData(raw) {
  const rows = [];
  for (const line of raw.split('\n').map(l => l.trim()).filter(Boolean)) {
    if (/^(product|name|item)/i.test(line)) continue;
    const delimIdx = Math.max(line.lastIndexOf(','), line.lastIndexOf(':'), line.lastIndexOf('\t'));
    if (delimIdx > 0) {
      const name = line.slice(0, delimIdx).trim().replace(/^["']|["']$/g, '');
      const qty  = parseInt(line.slice(delimIdx + 1).trim(), 10);
      if (name && !isNaN(qty) && qty >= 0) rows.push({ name, qty });
    }
  }
  return rows;
}

function downloadTemplate(products) {
  const blob = new Blob(['Product Name,Current Stock\n' + products.map(p => `"${p.name}",0`).join('\n')], { type: 'text/csv' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'smartvet_stock_template.csv' });
  a.click();
  URL.revokeObjectURL(a.href);
}

const VARIANCE_CLS = (v) =>
  v > 0 ? 'text-green-600 font-semibold' : v < 0 ? 'text-red-600 font-semibold' : 'text-gray-400';

function StockCountModal({ currentInventory, products, posApiUrl: initPosUrl, onPosApiUrlChange, onSave, onClose, currentUser }) {
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


// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function Inventory() {
  const { inventory, products, suppliers: suppliersMap, updateInventory, addProduct, updateProduct, deleteProduct, notify, recordStockCount, stockCounts, posApiUrl, setPosApiUrl } = useApp();
  const { currentUser } = useAuth();

  const [localInventory, setLocalInventory] = useState({ ...inventory });
  const [editMode, setEditMode]               = useState(false);
  const [search, setSearch]                   = useState('');
  const [statusFilter, setStatusFilter]       = useState('all');
  const [saving, setSaving]                   = useState(false);
  const [lastSaved, setLastSaved]             = useState(null);
  const [errors, setErrors]                   = useState({});
  const [sortField, setSortField]             = useState('');
  const [sortDir, setSortDir]                 = useState(1);
  const [showStockCount, setShowStockCount]   = useState(false);
  const [showAddModal, setShowAddModal]       = useState(false);
  const [editingProduct, setEditingProduct]             = useState(null);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState(null);

  const canManage = currentUser?.role === 'admin'
    || currentUser?.role === 'inventory_manager'
    || currentUser?.role === 'procurement_manager';

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = products.filter(p => {
    const q  = search.toLowerCase();
    const ok = !q || p.name.toLowerCase().includes(q)
      || (p.section || '').toLowerCase().includes(q)
      || p.supplier.toLowerCase().includes(q);
    const st = getStockStatus(p, localInventory[p.id] ?? 0);
    return ok && (statusFilter === 'all' || st === statusFilter);
  });

  // ── Group by supplier (preserving seed order) ────────────────────────────
  const grouped = useMemo(() => {
    const seen = [...new Set(products.map(p => p.supplier))];
    return seen.reduce((acc, sup) => {
      const prods = filtered.filter(p => p.supplier === sup);
      if (prods.length > 0) acc[sup] = prods;
      return acc;
    }, {});
  }, [products, filtered]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleChange = (productId, value) => {
    const num = parseInt(value, 10);
    const newErrors = { ...errors };
    if (value !== '' && (isNaN(num) || num < 0)) newErrors[productId] = true;
    else delete newErrors[productId];
    setErrors(newErrors);
    setLocalInventory(prev => ({ ...prev, [productId]: value === '' ? '' : Math.max(0, num) }));
  };

  const handleStockCountSave = useCallback(({ counts, countedBy, notes, source }) => {
    recordStockCount({ counts, countedBy, notes, source });
    setLocalInventory(prev => ({ ...prev, ...counts }));
    setShowStockCount(false);
    notify(`Stock count saved by ${countedBy} — inventory updated.`, 'success');
  }, [recordStockCount, notify]);

  const handleAddProduct = useCallback((data) => {
    const newProduct = addProduct(data);
    if (newProduct?.id) setLocalInventory(prev => ({ ...prev, [newProduct.id]: data.initialStock ?? 0 }));
  }, [addProduct]);

  const handleUpdateProduct = (data) => {
    updateProduct(editingProduct.id, data);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (product) => {
    deleteProduct(product.id);
    setDeleteConfirmProduct(null);
    const next = { ...localInventory };
    delete next[product.id];
    setLocalInventory(next);
  };

  const handleSave = () => {
    if (Object.keys(errors).length > 0) { notify('Fix invalid values first', 'error'); return; }
    const clean = {};
    products.forEach(p => {
      const v = localInventory[p.id];
      clean[p.id] = v === '' || isNaN(Number(v)) ? 0 : Number(v);
    });
    setSaving(true);
    setTimeout(() => {
      updateInventory(clean);
      setLastSaved(new Date().toISOString());
      setSaving(false);
    }, 300);
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d * -1);
    else { setSortField(field); setSortDir(1); }
  };

  // ── Stats ────────────────────────────────────────────────────────────────────
  const criticalCount = products.filter(p => getStockStatus(p, localInventory[p.id] ?? 0) === 'critical').length;
  const lowCount      = products.filter(p => getStockStatus(p, localInventory[p.id] ?? 0) === 'low').length;
  const okCount       = products.filter(p => getStockStatus(p, localInventory[p.id] ?? 0) === 'ok').length;
  const totalValue    = products.reduce((s, p) => s + (isNaN(Number(localInventory[p.id])) ? 0 : Number(localInventory[p.id])) * p.landedCost, 0);
  const retailValue   = products.reduce((s, p) => s + (isNaN(Number(localInventory[p.id])) ? 0 : Number(localInventory[p.id])) * p.retailPrice, 0);
  const totalCatalogueItems = Object.values(suppliersMap).reduce((s, d) => s + (d.catalogue?.length || 0), 0);
  const unsavedCount  = Object.keys(errors).length;

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {showAddModal && (
        <AddFromCatalogueModal suppliers={suppliersMap} existingProducts={products}
          onAdd={handleAddProduct} onClose={() => setShowAddModal(false)} />
      )}
      {editingProduct && (
        <EditProductModal product={editingProduct} suppliers={suppliersMap}
          onSubmit={handleUpdateProduct} onClose={() => setEditingProduct(null)} />
      )}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900">Remove Product</h3>
            <p className="mt-2 text-sm text-gray-600">Remove <strong>{deleteConfirmProduct.name}</strong> from inventory? This cannot be undone.</p>
            <div className="mt-5 flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirmProduct(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDeleteProduct(deleteConfirmProduct)}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">Remove</button>
            </div>
          </div>
        </div>
      )}
      {showStockCount && (
        <StockCountModal
          currentInventory={localInventory}
          products={products}
          posApiUrl={posApiUrl}
          onPosApiUrlChange={setPosApiUrl}
          currentUser={currentUser}
          onSave={handleStockCountSave}
          onClose={() => setShowStockCount(false)}
        />
      )}

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Inventory</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {editMode
              ? <>Edit the <span className="font-semibold text-gray-700">Current Stock</span> column, then Save. Stock also updates automatically when orders are received.</>
              : <>{products.length} product{products.length !== 1 ? 's' : ''} tracked · stock updates automatically when orders are received.</>
            }
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canManage && (
            <button onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-green-700 text-white rounded-lg text-sm font-semibold hover:bg-green-800 shadow-sm">
              + Add from Catalogue
            </button>
          )}
          {canManage && !editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 border-2 border-teal-600 text-teal-700 bg-white rounded-lg text-sm font-semibold hover:bg-teal-50 shadow-sm"
            >
              ✎ Edit Stock
            </button>
          )}
          {editMode && (
            <>
              <button
                onClick={() => { setEditMode(false); setLocalInventory({ ...inventory }); setErrors({}); }}
                className="px-4 py-2.5 border border-gray-300 text-gray-600 bg-white rounded-lg text-sm font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-colors ${
                  unsavedCount > 0
                    ? 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-60'
                    : 'bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-60'
                }`}>
                {saving ? '⏳ Saving…' : unsavedCount > 0 ? '⚠ Fix errors first' : '💾 Save & Check Reorders'}
              </button>
            </>
          )}
        </div>
      </div>
      {editMode && (
        <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-lg px-4 py-2.5 text-sm text-teal-800">
          <span>✎</span>
          <span><strong>Edit mode on</strong> — type stock quantities directly in the table below, then Save. Click Cancel to discard all changes.</span>
        </div>
      )}

      {/* ── Summary cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
          <p className="text-xs text-gray-400 font-medium">Products Tracked</p>
          <p className="text-2xl font-bold text-gray-800 mt-0.5">{products.length}</p>
        </div>
        <div className={`border rounded-xl px-4 py-3 shadow-sm ${criticalCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
          <p className="text-xs text-gray-400 font-medium">Critical</p>
          <p className={`text-2xl font-bold mt-0.5 ${criticalCount > 0 ? 'text-red-600' : 'text-gray-300'}`}>{criticalCount}</p>
        </div>
        <div className={`border rounded-xl px-4 py-3 shadow-sm ${lowCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'}`}>
          <p className="text-xs text-gray-400 font-medium">Low Stock</p>
          <p className={`text-2xl font-bold mt-0.5 ${lowCount > 0 ? 'text-amber-600' : 'text-gray-300'}`}>{lowCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
          <p className="text-xs text-gray-400 font-medium">Cost Value</p>
          <p className="text-sm font-bold text-gray-800 mt-0.5 font-mono">{formatCurrency(totalValue)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
          <p className="text-xs text-gray-400 font-medium">Retail Value</p>
          <p className="text-sm font-bold text-green-700 mt-0.5 font-mono">{formatCurrency(retailValue)}</p>
        </div>
        {/* Stock Count card — doubles as the trigger */}
        <button
          onClick={() => setShowStockCount(true)}
          className="group text-left border-2 border-dashed border-teal-300 bg-teal-50/40 hover:bg-teal-50 hover:border-teal-500 rounded-xl px-4 py-3 shadow-sm transition-colors"
        >
          <p className="text-xs text-teal-600 font-medium flex items-center gap-1">
            <span>📋</span> Stock Count
          </p>
          {stockCounts[0] ? (
            <>
              <p className="text-sm font-bold text-gray-800 mt-0.5 leading-tight">
                {new Date(stockCounts[0].date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </p>
              <p className="text-[11px] text-teal-600 font-medium mt-0.5 group-hover:underline">Record new →</p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-amber-600 mt-0.5">Never done</p>
              <p className="text-[11px] text-teal-600 font-medium mt-0.5 group-hover:underline">Start count →</p>
            </>
          )}
        </button>
      </div>

      {/* ── Save confirmation ────────────────────────────────────────────────── */}
      {lastSaved && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
          <span>✓</span>
          <span>Saved at {formatDateTime(lastSaved)} — reorder check complete.</span>
        </div>
      )}

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input type="text" placeholder="Search products, suppliers or sections…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {[
            { val: 'all',      label: `All  (${products.length})` },
            { val: 'critical', label: `Critical  (${criticalCount})` },
            { val: 'low',      label: `Low  (${lowCount})` },
            { val: 'ok',       label: `OK  (${okCount})` },
          ].map(({ val, label }) => (
            <button key={val} onClick={() => setStatusFilter(val)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === val ? 'bg-white text-green-800 shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2 text-xs text-gray-400">
          <span className="text-gray-300">Sort:</span>
          {['name', 'stock', 'status'].map(f => (
            <button key={f} onClick={() => handleSort(f)}
              className={`px-2.5 py-1 rounded-md border capitalize transition-colors ${
                sortField === f ? 'border-green-400 bg-green-50 text-green-700 font-semibold' : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}>
              {f}{sortField === f ? (sortDir === 1 ? ' ↑' : ' ↓') : ''}
            </button>
          ))}
        </div>
      </div>

      {/* ── Product tables ───────────────────────────────────────────────────── */}
      {products.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-16 text-center">
          <p className="text-4xl mb-3">📦</p>
          <p className="font-semibold text-gray-700 text-lg">No products tracked yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-5">Supplier catalogues are loaded — add products to start tracking.</p>
          {canManage && (
            <button onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-green-700 text-white rounded-xl font-semibold hover:bg-green-800 text-sm">
              + Add Products from Catalogue
            </button>
          )}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
          No products match your search or filter.
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([sup, prods]) => (
            <SupplierSection
              key={sup}
              supplier={sup}
              supplierDetails={suppliersMap[sup] || {}}
              products={prods}
              localInventory={localInventory}
              onChange={handleChange}
              errors={errors}
              editMode={editMode}
              sortField={sortField}
              sortDir={sortDir}
              canManage={canManage}
              onEdit={setEditingProduct}
              onDelete={setDeleteConfirmProduct}
            />
          ))}

          {/* Grand total */}
          <div className="bg-gradient-to-r from-green-800 to-teal-700 rounded-xl px-6 py-4 flex items-center justify-between text-white shadow-md">
            <div>
              <p className="text-green-200 text-xs font-medium uppercase tracking-wider">Total Inventory Value (cost)</p>
              <p className="text-2xl font-black font-mono mt-0.5">{formatCurrency(totalValue)}</p>
            </div>
            <div className="text-right">
              <p className="text-green-200 text-xs font-medium uppercase tracking-wider">Potential Retail Revenue</p>
              <p className="text-2xl font-black font-mono mt-0.5">{formatCurrency(retailValue)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
