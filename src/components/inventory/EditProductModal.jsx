/**
 * inventory/EditProductModal.jsx
 *
 * Modal dialog for editing an existing inventory product's supplier, unit,
 * stock thresholds, and pricing.
 *
 * Props:
 *   product   {Object}   — the product being edited (must include id, name, supplier, etc.)
 *   suppliers {Object}   — suppliersMap from AppContext (for the supplier dropdown)
 *   onSubmit  {Function} — called with the updated form data object
 *   onClose   {Function} — closes the modal without saving
 */

import { useState } from 'react';
import { formatCurrency } from '../../utils/formatter';

const UNITS = ['Units', 'Bottles', 'Liters', 'kg', 'Tablets', 'Vials', 'Packs', 'Doses', 'Sachets', 'Boxes', 'Tins'];

export default function EditProductModal({ product, suppliers, onSubmit, onClose }) {
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
