/**
 * orders/DispatchModal.jsx
 *
 * Modal for recording that a supplier has dispatched goods and the order
 * is now in transit. Captures tracking number, carrier, and expected delivery.
 *
 * Props:
 *   order     {Object}   — the order being marked dispatched
 *   onConfirm {Function} — called with { trackingNumber, carrier, expectedDeliveryDate, notes }
 *   onClose   {Function} — closes the modal without saving
 */

import { useState } from 'react';

export default function DispatchModal({ order, onConfirm, onClose }) {
  const [form, setForm] = useState({ trackingNumber: '', carrier: '', expectedDeliveryDate: '', notes: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="bg-gradient-to-r from-green-800 to-teal-700 px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-base">Mark as Dispatched</h3>
            <p className="text-green-200 text-xs mt-0.5">{order.orderId} · {order.supplier}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none">×</button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">Record that the supplier has dispatched the goods and they are now in transit.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tracking Number</label>
              <input type="text" value={form.trackingNumber} onChange={e => set('trackingNumber', e.target.value)}
                placeholder="e.g. UPS12345"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Carrier / Courier</label>
              <input type="text" value={form.carrier} onChange={e => set('carrier', e.target.value)}
                placeholder="e.g. DHL, UPS"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Expected Delivery Date *</label>
            <input type="date" value={form.expectedDeliveryDate} onChange={e => set('expectedDeliveryDate', e.target.value)}
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
          <button onClick={() => onConfirm(form)} disabled={!form.expectedDeliveryDate}
            className="px-5 py-2 bg-teal-700 text-white rounded-lg text-sm font-semibold hover:bg-teal-800 disabled:opacity-40">
            🚚 Mark In Transit
          </button>
        </div>
      </div>
    </div>
  );
}
