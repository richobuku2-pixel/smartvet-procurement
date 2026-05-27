/**
 * network/NewTransferModal.jsx
 *
 * Modal for creating a new stock transfer order from the main warehouse
 * to a dark store / branch location. Validates quantities against available stock.
 *
 * Props:
 *   locations  {Array}    — all locations from AppContext
 *   products   {Array}    — all products from AppContext
 *   inventory  {Object}   — main warehouse {productId: qty} map
 *   onClose    {Function} — closes the modal without creating
 *   onCreate   {Function} — called with the new transfer data object
 */

import { useState } from 'react';

export default function NewTransferModal({ locations, products, inventory, onClose, onCreate }) {
  const darkStores = locations.filter(l => !l.isMain && l.active !== false);
  const [toLocationId, setToLocationId] = useState(darkStores[0]?.id || '');
  const [items, setItems]   = useState([{ productId: '', qty: 1 }]);
  const [notes, setNotes]   = useState('');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!toLocationId) e.location = 'Select a destination';
    const validItems = items.filter(i => i.productId && Number(i.qty) > 0);
    if (!validItems.length) e.items = 'Add at least one item';
    items.forEach((it, idx) => {
      if (it.productId) {
        const avail = inventory[it.productId] || 0;
        if (Number(it.qty) > avail) e[`qty_${idx}`] = `Only ${avail} available`;
        if (Number(it.qty) < 1)    e[`qty_${idx}`] = 'Qty must be at least 1';
      }
    });
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const toLoc = locations.find(l => l.id === toLocationId);
    const transferItems = items
      .filter(i => i.productId && Number(i.qty) > 0)
      .map(i => {
        const prod = products.find(p => p.id === Number(i.productId));
        return {
          productId:   Number(i.productId),
          productName: prod?.name || '',
          quantity:    Number(i.qty),
          unit:        prod?.unit || '',
        };
      });
    onCreate({ toLocationId, toLocationName: toLoc?.name, fromLocationId: 'loc_main', items: transferItems, notes });
    onClose();
  };

  const addRow    = () => setItems(prev => [...prev, { productId: '', qty: 1 }]);
  const removeRow = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));
  const updateRow = (idx, key, val) =>
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [key]: val } : it));

  const usedIds = items.map(i => i.productId).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-semibold text-gray-900">New Transfer Order</h2>
            <p className="text-xs text-gray-500 mt-0.5">Send stock from Main Warehouse to a store</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Destination */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Destination <span className="text-red-500">*</span>
            </label>
            {darkStores.length === 0 ? (
              <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                No locations available. Add a store or depot first.
              </p>
            ) : (
              <select
                value={toLocationId}
                onChange={e => setToLocationId(e.target.value)}
                className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 ${
                  errors.location ? 'border-red-400' : 'border-gray-300'
                }`}
              >
                <option value="">Select location…</option>
                {darkStores.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            )}
            {errors.location && <p className="text-xs text-red-500 mt-0.5">{errors.location}</p>}
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600">
                Items <span className="text-red-500">*</span>
              </label>
              <button
                onClick={addRow}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium"
              >
                + Add row
              </button>
            </div>

            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 border-b border-gray-200">
                    <th className="px-3 py-2 text-left font-medium">Product</th>
                    <th className="px-3 py-2 text-right font-medium w-28">Available</th>
                    <th className="px-3 py-2 text-right font-medium w-24">Qty</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((it, idx) => {
                    const avail = it.productId ? (inventory[Number(it.productId)] ?? 0) : null;
                    const overQty = avail !== null && Number(it.qty) > avail;
                    return (
                      <tr key={idx} className={overQty ? 'bg-red-50' : ''}>
                        <td className="px-3 py-2">
                          <select
                            value={it.productId}
                            onChange={e => updateRow(idx, 'productId', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                          >
                            <option value="">Select product…</option>
                            {products.map(p => (
                              <option
                                key={p.id}
                                value={p.id}
                                disabled={usedIds.includes(String(p.id)) && it.productId !== String(p.id)}
                              >
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 text-right">
                          {avail !== null ? (
                            <span className={`text-xs font-medium ${avail === 0 ? 'text-red-500' : 'text-gray-500'}`}>
                              {avail}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            min={1}
                            max={avail || undefined}
                            value={it.qty}
                            onChange={e => updateRow(idx, 'qty', e.target.value)}
                            className={`w-20 border rounded px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-teal-400 ${
                              errors[`qty_${idx}`] ? 'border-red-400' : 'border-gray-300'
                            }`}
                          />
                          {errors[`qty_${idx}`] && (
                            <p className="text-xs text-red-500 mt-0.5 whitespace-nowrap">{errors[`qty_${idx}`]}</p>
                          )}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {items.length > 1 && (
                            <button
                              onClick={() => removeRow(idx)}
                              className="text-gray-300 hover:text-red-500 text-lg leading-none"
                            >
                              ×
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {errors.items && <p className="text-xs text-red-500 mt-1">{errors.items}</p>}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              placeholder="Optional dispatch notes…"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={darkStores.length === 0}
            className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Transfer
          </button>
        </div>
      </div>
    </div>
  );
}
