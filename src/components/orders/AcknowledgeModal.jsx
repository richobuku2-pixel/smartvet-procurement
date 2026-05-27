/**
 * orders/AcknowledgeModal.jsx
 *
 * Modal for recording that a supplier has acknowledged / confirmed receipt
 * of a purchase order.
 *
 * Props:
 *   order     {Object}   — the order being acknowledged
 *   onConfirm {Function} — called with { confirmedBy, expectedDispatchDate, notes }
 *   onClose   {Function} — closes the modal without saving
 */

import { useState } from 'react';

export default function AcknowledgeModal({ order, onConfirm, onClose }) {
  const [form, setForm] = useState({ confirmedBy: '', expectedDispatchDate: '', notes: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="bg-gradient-to-r from-green-800 to-teal-700 px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-base">Supplier Acknowledged</h3>
            <p className="text-green-200 text-xs mt-0.5">{order.orderId} · {order.supplier}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none">×</button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">Record that the supplier has confirmed receipt and acceptance of this order.</p>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Confirmed By (Supplier Contact)</label>
            <input type="text" value={form.confirmedBy} onChange={e => set('confirmedBy', e.target.value)}
              placeholder="e.g. Sales Team"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Expected Dispatch Date</label>
            <input type="date" value={form.expectedDispatchDate} onChange={e => set('expectedDispatchDate', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Notes (optional)</label>
            <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">Cancel</button>
          <button onClick={() => onConfirm(form)}
            className="px-5 py-2 bg-green-700 text-white rounded-lg text-sm font-semibold hover:bg-green-800">
            🤝 Mark Acknowledged
          </button>
        </div>
      </div>
    </div>
  );
}
