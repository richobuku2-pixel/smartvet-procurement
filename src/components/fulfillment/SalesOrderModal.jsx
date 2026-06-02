/**
 * SalesOrderModal
 *
 * Full detail view for a sales order. Shows:
 *   - Customer + order summary
 *   - Fulfillment timeline
 *   - Action buttons (advance status, fail, cancel)
 *   - Rider assignment
 *   - POD capture (when in_transit)
 *   - Payment status toggle
 */
import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, timeAgo } from '../../utils/formatter';

export const STATUS_META = {
  confirmed:  { label: 'Confirmed',  color: 'bg-blue-100 text-blue-700',    icon: '📋' },
  picking:    { label: 'Picking',    color: 'bg-purple-100 text-purple-700', icon: '📦' },
  packed:     { label: 'Packed',     color: 'bg-amber-100 text-amber-700',   icon: '📫' },
  dispatched: { label: 'Dispatched', color: 'bg-orange-100 text-orange-700', icon: '🏍️' },
  in_transit: { label: 'In Transit', color: 'bg-sky-100 text-sky-700',       icon: '🚚' },
  delivered:  { label: 'Delivered',  color: 'bg-green-100 text-green-700',   icon: '✅' },
  failed:     { label: 'Failed',     color: 'bg-red-100 text-red-600',       icon: '❌' },
  cancelled:  { label: 'Cancelled',  color: 'bg-gray-100 text-gray-500',     icon: '🚫' },
};

const NEXT_LABEL = {
  confirmed:  'Start Picking',
  picking:    'Mark Packed',
  packed:     'Dispatch',
  dispatched: 'Mark In Transit',
  in_transit: 'Confirm Delivery (POD)',
};

export default function SalesOrderModal({ order, onClose }) {
  const { riders, advanceSalesOrder, failSalesOrder, cancelSalesOrder,
          assignRiderToOrder, confirmPOD, updateSalesOrderPayment } = useApp();
  const { currentUser } = useAuth();

  const [showAssign, setShowAssign]  = useState(false);
  const [showPOD, setShowPOD]        = useState(false);
  const [showFail, setShowFail]      = useState(false);
  const [showCancel, setShowCancel]  = useState(false);
  const [failNote, setFailNote]      = useState('');
  const [cancelNote, setCancelNote]  = useState('');
  const [podNote, setPodNote]        = useState('');
  const [selectedRider, setSelectedRider] = useState(order.assignedRiderId || '');

  const by = currentUser?.name || currentUser?.email || 'System';
  const meta = STATUS_META[order.status] || STATUS_META.confirmed;
  const assignedRider = riders.find(r => r.id === order.assignedRiderId);
  const canAdvance = NEXT_LABEL[order.status];
  const canFail = ['dispatched', 'in_transit'].includes(order.status);
  const canCancel = ['confirmed', 'picking', 'packed'].includes(order.status);
  const availableRiders = riders.filter(r => r.status !== 'off_duty');

  const handleAdvance = () => {
    if (order.status === 'in_transit') {
      setShowPOD(true);
    } else {
      advanceSalesOrder(order.id, by);
      onClose();
    }
  };

  const handlePOD = () => {
    confirmPOD(order.id, { confirmedBy: by, note: podNote });
    onClose();
  };

  const handleFail = () => {
    failSalesOrder(order.id, by, failNote);
    onClose();
  };

  const handleCancel = () => {
    cancelSalesOrder(order.id, by, cancelNote);
    onClose();
  };

  const handleAssignRider = () => {
    if (!selectedRider) return;
    assignRiderToOrder(order.id, selectedRider, by);
    setShowAssign(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">{order.soNumber}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{order.customer?.name} · {order.deliveryZone}</p>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${meta.color}`}>
              {meta.icon} {meta.label}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <div className="p-6 space-y-5">

          {/* Summary row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Total</p>
              <p className="text-base font-bold text-gray-900 whitespace-nowrap">{formatCurrency(order.total)}</p>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : order.paymentStatus === 'partial' ? 'bg-amber-100 text-amber-700' : 'bg-red-50 text-red-500'}`}>
                {order.paymentStatus || 'pending'}
              </span>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Payment</p>
              <p className="text-sm font-semibold text-gray-700 capitalize">{(order.paymentMethod || '').replace('_', ' ')}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Expected</p>
              <p className="text-sm font-semibold text-gray-700">{order.expectedDelivery || '—'}</p>
            </div>
          </div>

          {/* Customer */}
          <div className="border border-gray-100 rounded-xl p-4">
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Customer</p>
            <div className="flex items-start gap-4 flex-wrap">
              <div>
                <p className="text-sm font-semibold text-gray-800">{order.customer?.name}</p>
                <p className="text-xs text-gray-400">{order.customer?.phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">{order.customer?.location}</p>
                <p className="text-xs text-gray-400 capitalize">{order.customer?.type}</p>
              </div>
              {order.deliveryAddress && (
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-semibold">Delivery address</p>
                  <p className="text-xs text-gray-600">{order.deliveryAddress}</p>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Order Items</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-1 text-left text-gray-400 font-semibold">Product</th>
                  <th className="pb-1 text-right text-gray-400 font-semibold">Qty</th>
                  <th className="pb-1 text-right text-gray-400 font-semibold">Unit Price</th>
                  <th className="pb-1 text-right text-gray-400 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(order.items || []).map((item, i) => (
                  <tr key={i}>
                    <td className="py-2 text-gray-800 font-medium">{item.productName}
                      <span className="ml-1 text-[10px] text-gray-400 capitalize">({item.tier})</span>
                    </td>
                    <td className="py-2 text-right text-gray-600">{item.quantity} {item.unit}</td>
                    <td className="py-2 text-right text-gray-600 whitespace-nowrap">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-2 text-right font-semibold text-gray-800 whitespace-nowrap">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200">
                  <td colSpan="3" className="pt-2 text-right text-gray-400">Subtotal</td>
                  <td className="pt-2 text-right font-semibold text-gray-700 whitespace-nowrap">{formatCurrency(order.subtotal)}</td>
                </tr>
                {order.deliveryFee > 0 && (
                  <tr>
                    <td colSpan="3" className="text-right text-gray-400">Delivery fee</td>
                    <td className="text-right text-gray-600 whitespace-nowrap">{formatCurrency(order.deliveryFee)}</td>
                  </tr>
                )}
                <tr>
                  <td colSpan="3" className="text-right font-bold text-gray-800">Total</td>
                  <td className="text-right font-bold text-gray-900 whitespace-nowrap">{formatCurrency(order.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Rider assignment */}
          <div className="border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-gray-500 uppercase">Assigned Rider</p>
              {!['delivered','failed','cancelled'].includes(order.status) && (
                <button onClick={() => setShowAssign(v => !v)}
                  className="text-xs text-green-700 hover:text-green-900 font-semibold">
                  {assignedRider ? 'Change' : '+ Assign'}
                </button>
              )}
            </div>
            {assignedRider ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold">
                  {assignedRider.name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{assignedRider.name}</p>
                  <p className="text-xs text-gray-400">{assignedRider.phone} · {assignedRider.vehicleType}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400">No rider assigned yet</p>
            )}
            {showAssign && (
              <div className="mt-3 flex gap-2">
                <select value={selectedRider} onChange={e => setSelectedRider(e.target.value)}
                  className="flex-1 text-xs border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">Select rider…</option>
                  {availableRiders.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} — {r.status === 'on_delivery' ? '🟡 On delivery' : '🟢 Available'} · {r.zone}
                    </option>
                  ))}
                </select>
                <button onClick={handleAssignRider} disabled={!selectedRider}
                  className="px-3 py-2 bg-green-700 hover:bg-green-800 disabled:bg-gray-200 text-white text-xs font-semibold rounded-lg">
                  Assign
                </button>
              </div>
            )}
          </div>

          {/* Payment status */}
          {!['delivered','cancelled'].includes(order.status) && (
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs text-gray-500 font-semibold mr-1">Payment:</p>
              {['pending','partial','paid'].map(ps => (
                <button key={ps} onClick={() => updateSalesOrderPayment(order.id, ps)}
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold border transition-colors ${order.paymentStatus === ps ? 'bg-green-100 text-green-700 border-green-300' : 'bg-white text-gray-500 border-gray-200 hover:border-green-300'}`}>
                  {ps.charAt(0).toUpperCase() + ps.slice(1)}
                </button>
              ))}
            </div>
          )}

          {/* Fulfillment timeline */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-3">Fulfillment Log</p>
            <div className="space-y-2">
              {(order.fulfillmentLog || []).slice().reverse().map((entry, i) => {
                const m = STATUS_META[entry.status] || {};
                return (
                  <div key={i} className="flex gap-3 text-xs">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px]">{m.icon || '·'}</span>
                    <div className="flex-1">
                      <span className={`font-semibold px-1.5 py-0.5 rounded-full text-[10px] ${m.color || 'bg-gray-100 text-gray-500'}`}>{entry.status?.replace('_',' ')}</span>
                      {entry.note && <span className="text-gray-400 ml-2">{entry.note}</span>}
                      <p className="text-[10px] text-gray-300 mt-0.5">{entry.by} · {timeAgo(entry.timestamp)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* POD form */}
          {showPOD && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-bold text-green-800">Confirm Proof of Delivery</p>
              <textarea value={podNote} onChange={e => setPodNote(e.target.value)}
                placeholder="Delivery note (optional)…" rows={2}
                className="w-full text-xs border border-green-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              <div className="flex gap-2">
                <button onClick={handlePOD}
                  className="flex-1 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-lg">
                  ✅ Confirm Delivered
                </button>
                <button onClick={() => setShowPOD(false)} className="px-4 py-2 text-xs text-gray-500 hover:text-gray-700">Cancel</button>
              </div>
            </div>
          )}

          {/* Fail form */}
          {showFail && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-bold text-red-700">Mark as Failed Delivery</p>
              <input type="text" value={failNote} onChange={e => setFailNote(e.target.value)}
                placeholder="Reason (e.g. customer not available)…"
                className="w-full text-xs border border-red-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400" />
              <div className="flex gap-2">
                <button onClick={handleFail}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg">
                  Mark Failed
                </button>
                <button onClick={() => setShowFail(false)} className="px-4 py-2 text-xs text-gray-500 hover:text-gray-700">Cancel</button>
              </div>
            </div>
          )}

          {/* Cancel form */}
          {showCancel && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-bold text-gray-700">Cancel Order</p>
              <input type="text" value={cancelNote} onChange={e => setCancelNote(e.target.value)}
                placeholder="Reason for cancellation…"
                className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400" />
              <div className="flex gap-2">
                <button onClick={handleCancel}
                  className="flex-1 py-2 bg-gray-700 hover:bg-gray-800 text-white text-xs font-bold rounded-lg">
                  Cancel Order
                </button>
                <button onClick={() => setShowCancel(false)} className="px-4 py-2 text-xs text-gray-500 hover:text-gray-700">Back</button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {!['delivered','failed','cancelled'].includes(order.status) && !showPOD && !showFail && !showCancel && (
            <div className="flex gap-2 flex-wrap pt-1 border-t border-gray-100">
              {canAdvance && (
                <button onClick={handleAdvance}
                  className="flex-1 min-w-32 py-2.5 bg-green-700 hover:bg-green-800 text-white text-sm font-bold rounded-xl transition-colors">
                  {NEXT_LABEL[order.status]} →
                </button>
              )}
              {canFail && (
                <button onClick={() => setShowFail(true)}
                  className="px-4 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold rounded-xl">
                  Mark Failed
                </button>
              )}
              {canCancel && (
                <button onClick={() => setShowCancel(true)}
                  className="px-4 py-2.5 border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm font-semibold rounded-xl">
                  Cancel
                </button>
              )}
            </div>
          )}

          {order.notes && (
            <p className="text-xs text-gray-400 italic">Note: {order.notes}</p>
          )}
        </div>
      </div>
    </div>
  );
}
