/**
 * network/ReceiveTransferModal.jsx
 *
 * Modal for confirming receipt of a stock transfer at a dark store / branch.
 * Lets staff adjust received quantities and flag discrepancies before saving.
 *
 * Props:
 *   transfer  {Object}   — the transfer order being received
 *   onClose   {Function} — closes the modal without confirming
 *   onConfirm {Function} — called with (receivedItems, notes) when the user confirms
 */

import { useState } from 'react';

export default function ReceiveTransferModal({ transfer, onClose, onConfirm }) {
  const initQtys = Object.fromEntries(
    (transfer.items || []).map(i => [i.productId, i.quantity])
  );
  const [qtys, setQtys] = useState(initQtys);
  const [notes, setNotes] = useState('');

  const hasDisc = (transfer.items || []).some(
    i => Number(qtys[i.productId]) !== i.quantity
  );

  const handleConfirm = () => {
    const receivedItems = (transfer.items || []).map(i => ({
      productId:   i.productId,
      productName: i.productName,
      receivedQty: Number(qtys[i.productId] ?? 0),
    }));
    onConfirm(receivedItems, notes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Confirm Receipt — {transfer.orderId}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Recording arrival at <strong>{transfer.toLocationName}</strong>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-4">
          {/* Items table */}
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 border-b border-gray-200">
                  <th className="px-3 py-2 text-left font-medium">Product</th>
                  <th className="px-3 py-2 text-right font-medium">Ordered</th>
                  <th className="px-3 py-2 text-right font-medium">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(transfer.items || []).map(item => {
                  const rec  = Number(qtys[item.productId] ?? 0);
                  const disc = rec !== item.quantity;
                  return (
                    <tr key={item.productId} className={disc ? 'bg-amber-50' : ''}>
                      <td className="px-3 py-2 text-gray-700">{item.productName}</td>
                      <td className="px-3 py-2 text-right text-gray-500">{item.quantity}</td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          min={0}
                          value={qtys[item.productId] ?? item.quantity}
                          onChange={e =>
                            setQtys(prev => ({ ...prev, [item.productId]: e.target.value }))
                          }
                          className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-teal-400"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {hasDisc && (
            <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
              <span>⚠️</span>
              <span>
                Quantity discrepancies detected. Stock will be updated with received quantities only.
                Main warehouse will be debited by the received amounts.
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              placeholder="Condition notes, discrepancy reasons…"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            ✓ Confirm Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
