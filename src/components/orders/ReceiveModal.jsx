/**
 * orders/ReceiveModal.jsx
 *
 * Modal for confirming receipt of goods at the warehouse. Lets staff verify
 * actual received quantities against the ordered quantities and flag discrepancies.
 *
 * Props:
 *   order     {Object}   — the order being received
 *   onConfirm {Function} — called with { receivedBy, discrepancyNotes, receivedItems }
 *   onClose   {Function} — closes the modal without saving
 */

import { useState } from 'react';
import { formatCurrency } from '../../utils/formatter';

export default function ReceiveModal({ order, onConfirm, onClose }) {
  const [receivedBy, setReceivedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [qtys, setQtys] = useState(
    Object.fromEntries(order.items.map(i => [i.productId ?? i.id ?? i.productName, i.quantity]))
  );

  const totalOrdered  = order.items.reduce((s, i) => s + i.quantity, 0);
  const totalReceived = order.items.reduce((s, i) => s + (qtys[i.productId ?? i.id ?? i.productName] || 0), 0);
  const hasDiscrepancy = totalReceived !== totalOrdered;

  const handleConfirm = () => {
    const receivedItems = order.items.map(item => {
      const key = item.productId ?? item.id ?? item.productName;
      return {
        productId: item.productId,
        productName: item.productName,
        unit: item.unit,
        orderedQty: item.quantity,
        receivedQty: qtys[key] || 0,
        unitCost: item.unitCost,
      };
    });
    onConfirm({ receivedBy, discrepancyNotes: notes, receivedItems });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-green-800 to-teal-700 px-6 py-4 rounded-t-2xl flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-white font-bold text-base">Confirm Receipt at Warehouse</h3>
            <p className="text-green-200 text-xs mt-0.5">{order.orderId} · {order.supplier} · UGX {order.totalCost?.toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <p className="text-sm text-gray-600">
            Verify quantities received. Once confirmed, stock will be added to the main warehouse inventory.
          </p>

          {/* Per-item received quantities */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Items Received</p>
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <th className="px-4 py-2.5 text-left">Product</th>
                    <th className="px-4 py-2.5 text-center w-24">Ordered</th>
                    <th className="px-4 py-2.5 text-center w-28">Received</th>
                    <th className="px-4 py-2.5 text-center w-20">Match</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {order.items.map(item => {
                    const key = item.productId ?? item.id ?? item.productName;
                    const recv = qtys[key] || 0;
                    const match = recv === item.quantity;
                    return (
                      <tr key={key} className={recv !== item.quantity ? 'bg-amber-50/40' : ''}>
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-gray-800 text-sm">{item.productName}</p>
                          <p className="text-xs text-gray-400">{item.unit}</p>
                        </td>
                        <td className="px-4 py-2.5 text-center font-mono font-semibold">{item.quantity}</td>
                        <td className="px-4 py-2.5 text-center">
                          <input
                            type="number" min="0"
                            value={qtys[key]}
                            onChange={e => setQtys(p => ({ ...p, [key]: parseInt(e.target.value, 10) || 0 }))}
                            className={`w-20 text-center border rounded-lg px-2 py-1 text-sm font-mono font-bold focus:outline-none focus:ring-2 ${
                              match ? 'border-gray-200 focus:ring-green-400' : 'border-amber-300 bg-amber-50 text-amber-700 focus:ring-amber-400'
                            }`}
                          />
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {match
                            ? <span className="text-green-600 font-bold">✓</span>
                            : <span className="text-amber-600 text-xs font-semibold">Δ {recv - item.quantity > 0 ? '+' : ''}{recv - item.quantity}</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-500">Total</td>
                    <td className="px-4 py-2.5 text-center font-mono font-bold">{totalOrdered}</td>
                    <td className="px-4 py-2.5 text-center font-mono font-bold text-teal-700">{totalReceived}</td>
                    <td className="px-4 py-2.5 text-center">
                      {hasDiscrepancy
                        ? <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">Discrepancy</span>
                        : <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">All match</span>
                      }
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Received By *</label>
              <input type="text" value={receivedBy} onChange={e => setReceivedBy(e.target.value)}
                placeholder="Staff member name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Notes / Discrepancies</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Any comments about this delivery"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>

          {hasDiscrepancy && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
              ⚠ Quantities differ from the purchase order. The received quantities will be used to update inventory.
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-between bg-gray-50 rounded-b-2xl flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">Cancel</button>
          <button onClick={handleConfirm} disabled={!receivedBy.trim()}
            className="px-6 py-2.5 bg-green-700 text-white rounded-lg text-sm font-semibold hover:bg-green-800 disabled:opacity-40">
            📦 Confirm Receipt & Update Inventory
          </button>
        </div>
      </div>
    </div>
  );
}
