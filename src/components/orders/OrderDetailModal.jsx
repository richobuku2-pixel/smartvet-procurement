/**
 * orders/OrderDetailModal.jsx
 *
 * Full order detail view as a modal overlay. Shows:
 *   - Summary strip (value, item count, ETA)
 *   - Full pipeline status bar
 *   - Line-items table
 *   - Received quantities table (when order is received)
 *   - Full order timeline (via OrderTimeline)
 *   - Action footer with contextual buttons (Acknowledge / Dispatch / Receive)
 *
 * Props:
 *   order        {Object}   — full order object from AppContext
 *   onClose      {Function} — closes the modal
 *   onAcknowledge {Function} — opens AcknowledgeModal for this order
 *   onDispatch   {Function} — opens DispatchModal for this order
 *   onReceive    {Function} — opens ReceiveModal for this order
 *   canAdvance   {boolean}  — whether the user has permission to advance order status
 */

import { ORDER_STATUSES, PO_PIPELINE } from '../../data/seedData';
import { formatCurrency, daysUntil } from '../../utils/formatter';
import OrderTimeline from './OrderTimeline';

export default function OrderDetailModal({ order, onClose, onAcknowledge, onDispatch, onReceive, canAdvance }) {
  const eta = order.shipment?.expectedDeliveryDate ? daysUntil(order.shipment.expectedDeliveryDate) : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-green-800 to-teal-700 px-6 py-4 rounded-t-2xl flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-white font-bold text-base font-mono">{order.orderId}</h3>
            <p className="text-green-200 text-sm">{order.supplier}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-medium">
              {ORDER_STATUSES[order.status]?.label ?? order.status}
            </span>
            <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none">×</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Summary strip */}
          <div className="px-6 py-4 border-b border-gray-100 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-400">Total Value</p>
              <p className="font-mono font-bold text-gray-800">{formatCurrency(order.totalCost)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Items</p>
              <p className="font-semibold text-gray-800">{order.items.length} product{order.items.length !== 1 ? 's' : ''}</p>
            </div>
            {eta !== null && (
              <div>
                <p className="text-xs text-gray-400">Delivery ETA</p>
                <p className={`font-semibold ${eta < 0 ? 'text-red-600' : eta === 0 ? 'text-amber-600' : 'text-teal-700'}`}>
                  {eta < 0 ? `${Math.abs(eta)}d overdue` : eta === 0 ? 'Today' : `${eta} day${eta !== 1 ? 's' : ''}`}
                </p>
              </div>
            )}
          </div>

          {/* Pipeline bar */}
          <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-1 flex-wrap">
              {PO_PIPELINE.map((s, i) => {
                const step = ORDER_STATUSES[s.key]?.step ?? 0;
                const curr = ORDER_STATUSES[order.status]?.step ?? 0;
                const done = step < curr;
                const active = step === curr;
                return (
                  <div key={s.key} className="flex items-center gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                      done   ? 'bg-green-100 text-green-700' :
                      active ? 'bg-teal-600 text-white' :
                               'bg-gray-100 text-gray-400'
                    }`}>{s.short}</span>
                    {i < PO_PIPELINE.length - 1 && <span className={`text-xs ${done ? 'text-green-300' : 'text-gray-200'}`}>›</span>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Items table */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Order Items</p>
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                      <th className="px-4 py-2.5 text-left">Product</th>
                      <th className="px-4 py-2.5 text-right">Qty</th>
                      <th className="px-4 py-2.5 text-right">Unit Cost</th>
                      <th className="px-4 py-2.5 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {order.items.map((item, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2.5 font-medium text-gray-800">{item.productName}</td>
                        <td className="px-4 py-2.5 text-right font-mono">{item.quantity} {item.unit}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-gray-500">{formatCurrency(item.unitCost)}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold">{formatCurrency(item.lineCost)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
                      <td colSpan={3} className="px-4 py-2.5 text-sm">Total</td>
                      <td className="px-4 py-2.5 text-right font-mono">{formatCurrency(order.totalCost)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Delivery confirmation (if received) */}
            {order.delivery?.receivedItems && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Received Quantities</p>
                <div className="rounded-xl border border-green-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-green-50 text-xs text-gray-500 uppercase">
                        <th className="px-4 py-2 text-left">Product</th>
                        <th className="px-4 py-2 text-center">Ordered</th>
                        <th className="px-4 py-2 text-center">Received</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {order.delivery.receivedItems.map((item, i) => (
                        <tr key={i} className={item.receivedQty !== item.orderedQty ? 'bg-amber-50/40' : ''}>
                          <td className="px-4 py-2 font-medium text-gray-700">{item.productName}</td>
                          <td className="px-4 py-2 text-center font-mono">{item.orderedQty}</td>
                          <td className="px-4 py-2 text-center font-mono font-bold text-green-700">{item.receivedQty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Order Timeline</p>
              <OrderTimeline order={order} />
            </div>
          </div>
        </div>

        {/* Action footer — only when there is an action to show */}
        {canAdvance && ['sent', 'supplier_acknowledged', 'dispatched'].includes(order.status) && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex gap-3 justify-end flex-shrink-0">
            {order.status === 'sent' && (
              <button onClick={onAcknowledge}
                className="flex items-center gap-2 px-4 py-2.5 bg-teal-700 text-white rounded-lg text-sm font-semibold hover:bg-teal-800">
                🤝 Mark Acknowledged
              </button>
            )}
            {order.status === 'supplier_acknowledged' && (
              <button onClick={onDispatch}
                className="flex items-center gap-2 px-4 py-2.5 bg-teal-700 text-white rounded-lg text-sm font-semibold hover:bg-teal-800">
                🚚 Mark Dispatched
              </button>
            )}
            {order.status === 'dispatched' && (
              <button onClick={onReceive}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-700 text-white rounded-lg text-sm font-semibold hover:bg-green-800">
                📦 Confirm Receipt
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
