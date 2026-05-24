import { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import OrderStatusBadge from '../components/OrderStatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import EmailPreviewModal from '../components/EmailPreviewModal';
import PurchaseOrderModal from '../components/PurchaseOrderModal';
import { formatCurrency, formatDate, formatDateTime, daysUntil } from '../utils/formatter';
import { ORDER_STATUSES, PO_PIPELINE } from '../data/seedData';
import { storage } from '../utils/storage';

// ─── Mini pipeline progress bar ───────────────────────────────────────────────
function PipelineBar({ status }) {
  const currentStep = ORDER_STATUSES[status]?.step ?? 0;
  if (status === 'rejected') {
    return <span className="text-xs text-red-500 font-medium">Rejected</span>;
  }
  return (
    <div className="flex items-center gap-0.5">
      {PO_PIPELINE.map((s, i) => {
        const done    = i < currentStep;
        const current = i === currentStep;
        return (
          <div key={s.key} className="flex items-center gap-0.5">
            <div
              title={s.short}
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                done    ? 'bg-green-500' :
                current ? 'bg-teal-500 ring-2 ring-teal-200' :
                          'bg-gray-200'
              }`}
            />
            {i < PO_PIPELINE.length - 1 && (
              <div className={`w-3 h-px flex-shrink-0 ${done ? 'bg-green-300' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Full timeline event list (inside detail modal) ──────────────────────────
function OrderTimeline({ order }) {
  const events = [];

  if (order.createdAt)
    events.push({ label: 'Order Created', at: order.createdAt, icon: '📋', note: `Draft order — ${order.items.length} item(s)` });

  if (order.procurementApproval)
    events.push({ label: 'Procurement Approved', at: order.procurementApproval.approvedAt, icon: '✅',
      note: `by ${order.procurementApproval.approverName}${order.procurementApproval.comments ? ` — "${order.procurementApproval.comments}"` : ''}` });

  if (order.accountsApproval)
    events.push({ label: 'Accounts Approved', at: order.accountsApproval.approvedAt, icon: '✅',
      note: `by ${order.accountsApproval.approverName}${order.accountsApproval.comments ? ` — "${order.accountsApproval.comments}"` : ''}` });

  if (order.emailSent)
    events.push({ label: 'Sent to Supplier', at: order.emailSent.sentAt, icon: '📧',
      note: `to ${order.emailSent.sentTo}` });

  if (order.supplierAcknowledgment)
    events.push({ label: 'Supplier Acknowledged', at: order.supplierAcknowledgment.acknowledgedAt, icon: '🤝',
      note: [
        order.supplierAcknowledgment.confirmedBy && `by ${order.supplierAcknowledgment.confirmedBy}`,
        order.supplierAcknowledgment.expectedDispatchDate && `Expected dispatch: ${formatDate(order.supplierAcknowledgment.expectedDispatchDate)}`,
        order.supplierAcknowledgment.notes,
      ].filter(Boolean).join(' · ') });

  if (order.shipment)
    events.push({ label: 'Dispatched / In Transit', at: order.shipment.dispatchedAt, icon: '🚚',
      note: [
        order.shipment.trackingNumber && `Tracking: ${order.shipment.trackingNumber}`,
        order.shipment.carrier && `via ${order.shipment.carrier}`,
        order.shipment.expectedDeliveryDate && `Expected delivery: ${formatDate(order.shipment.expectedDeliveryDate)}`,
        order.shipment.notes,
      ].filter(Boolean).join(' · ') });

  if (order.delivery)
    events.push({ label: 'Received at Warehouse', at: order.delivery.receivedAt, icon: '📦',
      note: [
        order.delivery.receivedBy && `Received by ${order.delivery.receivedBy}`,
        order.delivery.discrepancyNotes && `Note: ${order.delivery.discrepancyNotes}`,
      ].filter(Boolean).join(' · ') });

  if (order.status === 'rejected')
    events.push({ label: 'Rejected', at: order.updatedAt, icon: '❌', note: '' });

  return (
    <div className="space-y-0">
      {events.map((ev, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center text-sm flex-shrink-0">
              {ev.icon}
            </div>
            {i < events.length - 1 && <div className="w-px flex-1 bg-gray-100 my-1" />}
          </div>
          <div className={`pb-4 ${i === events.length - 1 ? '' : ''}`}>
            <p className="text-sm font-semibold text-gray-800 leading-snug">{ev.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(ev.at)}</p>
            {ev.note && <p className="text-xs text-gray-500 mt-0.5 italic">{ev.note}</p>}
          </div>
        </div>
      ))}

      {/* Pending steps */}
      {order.status !== 'received' && order.status !== 'rejected' && (() => {
        const currentStep = ORDER_STATUSES[order.status]?.step ?? 0;
        const pendingSteps = PO_PIPELINE.filter(s => (ORDER_STATUSES[s.key]?.step ?? 0) > currentStep);
        return pendingSteps.length > 0 ? (
          <div className="flex gap-3 opacity-40">
            <div className="w-8 flex-shrink-0 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full border-2 border-dashed border-gray-300" />
            </div>
            <div className="pb-2">
              <p className="text-xs text-gray-400">Next: {pendingSteps.map(s => ORDER_STATUSES[s.key]?.label).join(' → ')}</p>
            </div>
          </div>
        ) : null;
      })()}
    </div>
  );
}

// ─── Mark Acknowledged modal ──────────────────────────────────────────────────
function AcknowledgeModal({ order, onConfirm, onClose }) {
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

// ─── Mark Dispatched modal ────────────────────────────────────────────────────
function DispatchModal({ order, onConfirm, onClose }) {
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

// ─── Receive Order modal ──────────────────────────────────────────────────────
function ReceiveModal({ order, onConfirm, onClose }) {
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

// ─── Order Detail modal ───────────────────────────────────────────────────────
function OrderDetailModal({ order, onClose, onAcknowledge, onDispatch, onReceive, canAdvance }) {
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


// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function Orders() {
  const {
    orders, updateOrderStatus, sendOrderEmail, deleteOrder,
    markAcknowledged, markDispatched, receiveOrder,
    hasPermission, notify,
  } = useApp();
  const { currentUser } = useAuth();

  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [view, setView]               = useState('active');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [emailOrder, setEmailOrder]   = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [poModalOpen, setPoModalOpen] = useState(false);
  const [poOrder, setPoOrder]         = useState(null);
  const [actionModal, setActionModal] = useState(null); // { type: 'acknowledge'|'dispatch'|'receive', order }

  const canAdvance = currentUser?.role === 'admin' || currentUser?.role === 'inventory_manager';

  const suppliers = [...new Set(orders.map(o => o.supplier))];
  const isActive  = o => !['received', 'rejected'].includes(o.status);

  const displayed = orders.filter(o => {
    if (view === 'active' && !isActive(o)) return false;
    if (view === 'history' && isActive(o)) return false;
    const q = search.toLowerCase();
    const matchSearch = !q || o.orderId?.toLowerCase().includes(q) ||
      o.supplier?.toLowerCase().includes(q) ||
      o.items?.some(i => i.productName?.toLowerCase().includes(q));
    const matchStatus   = statusFilter === 'all' || o.status === statusFilter;
    const matchSupplier = supplierFilter === 'all' || o.supplier === supplierFilter;
    return matchSearch && matchStatus && matchSupplier;
  }).sort((a, b) => new Date(b.updatedAt ?? b.createdAt) - new Date(a.updatedAt ?? a.createdAt));

  const handleSubmit = (order) => {
    updateOrderStatus(order.id, 'pending_procurement');
    notify(`Order ${order.orderId} submitted for procurement approval`, 'success');
  };

  const handleAcknowledge = useCallback((data) => {
    markAcknowledged(actionModal.order.id, data);
    setActionModal(null);
    setSelectedOrder(prev => prev?.id === actionModal.order.id
      ? { ...prev, status: 'supplier_acknowledged', supplierAcknowledgment: { ...data, acknowledgedAt: new Date().toISOString() } }
      : prev
    );
  }, [actionModal, markAcknowledged]);

  const handleDispatch = useCallback((data) => {
    markDispatched(actionModal.order.id, data);
    setActionModal(null);
    setSelectedOrder(prev => prev?.id === actionModal.order.id
      ? { ...prev, status: 'dispatched', shipment: { ...data, dispatchedAt: new Date().toISOString() } }
      : prev
    );
  }, [actionModal, markDispatched]);

  const handleReceive = useCallback((data) => {
    receiveOrder(actionModal.order.id, data);
    setActionModal(null);
    setSelectedOrder(null);
  }, [actionModal, receiveOrder]);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(storage.exportAll(), null, 2)], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `smartvet-orders-${new Date().toISOString().split('T')[0]}.json`,
    });
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // ETA display helper
  const getEtaChip = (order) => {
    if (order.status !== 'dispatched' || !order.shipment?.expectedDeliveryDate) return null;
    const days = daysUntil(order.shipment.expectedDeliveryDate);
    if (days === null) return null;
    const cls = days < 0 ? 'bg-red-100 text-red-700' : days === 0 ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700';
    const label = days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `ETA ${days}d`;
    return <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>;
  };

  const activeCounts = { total: orders.filter(isActive).length };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">

      {/* Action modals */}
      {actionModal?.type === 'acknowledge' && (
        <AcknowledgeModal order={actionModal.order} onConfirm={handleAcknowledge} onClose={() => setActionModal(null)} />
      )}
      {actionModal?.type === 'dispatch' && (
        <DispatchModal order={actionModal.order} onConfirm={handleDispatch} onClose={() => setActionModal(null)} />
      )}
      {actionModal?.type === 'receive' && (
        <ReceiveModal order={actionModal.order} onConfirm={handleReceive} onClose={() => setActionModal(null)} />
      )}

      {/* Order detail modal */}
      {selectedOrder && !actionModal && (
        <OrderDetailModal
          order={orders.find(o => o.id === selectedOrder.id) ?? selectedOrder}
          onClose={() => setSelectedOrder(null)}
          canAdvance={canAdvance}
          onAcknowledge={() => setActionModal({ type: 'acknowledge', order: selectedOrder })}
          onDispatch={() => setActionModal({ type: 'dispatch', order: selectedOrder })}
          onReceive={() => setActionModal({ type: 'receive', order: selectedOrder })}
        />
      )}

      <EmailPreviewModal
        order={emailOrder}
        onClose={() => setEmailOrder(null)}
        onConfirmSend={() => { sendOrderEmail(emailOrder); setEmailOrder(null); }}
      />
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Delete Order"
        message={`Delete ${deleteConfirm?.orderId}? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => { deleteOrder(deleteConfirm.id); setDeleteConfirm(null); }}
        onCancel={() => setDeleteConfirm(null)}
      />
      <PurchaseOrderModal
        isOpen={poModalOpen}
        onClose={() => { setPoModalOpen(false); setPoOrder(null); }}
        prefillOrder={poOrder}
      />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Purchase Orders</h2>
          <p className="text-sm text-gray-500">
            {activeCounts.total} active · {orders.length} total · track from creation to warehouse receipt
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setPoOrder(null); setPoModalOpen(true); }}
            className="px-4 py-2.5 bg-red-900 text-white rounded-lg text-sm font-semibold hover:bg-red-800 flex items-center gap-1.5"
          >
            📄 Generate PO
          </button>
          <button onClick={handleExport}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
            Export JSON
          </button>
        </div>
      </div>

      {/* ── View toggle + filters ──────────────────────────────────────── */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {['active', 'history'].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                view === v ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {v === 'active' ? `Active (${activeCounts.total})` : 'History'}
            </button>
          ))}
        </div>
        <input type="text" placeholder="Search order, supplier, product…"
          value={search} onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-teal-500" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="all">All Statuses</option>
          {Object.entries(ORDER_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="all">All Suppliers</option>
          {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* ── Orders table ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {displayed.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            <p className="text-3xl mb-3">🧾</p>
            <p className="font-medium text-gray-600">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3 text-left">Order</th>
                  <th className="px-4 py-3 text-left">Supplier</th>
                  <th className="px-4 py-3 text-right">Value</th>
                  <th className="px-4 py-3 text-center">Progress</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Updated</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayed.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50/60 transition-colors group">

                    {/* Order ID */}
                    <td className="px-5 py-3.5">
                      <p className="font-mono font-semibold text-gray-800 text-xs">{order.orderId}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                    </td>

                    {/* Supplier */}
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-gray-800">{order.supplier}</p>
                      {getEtaChip(order)}
                    </td>

                    {/* Value */}
                    <td className="px-4 py-3.5 text-right font-mono font-medium text-gray-800">
                      {formatCurrency(order.totalCost)}
                    </td>

                    {/* Pipeline progress */}
                    <td className="px-4 py-3.5 text-center">
                      <PipelineBar status={order.status} />
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3.5">
                      <OrderStatusBadge status={order.status} />
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3.5 text-xs text-gray-400">
                      {formatDate(order.updatedAt ?? order.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => setSelectedOrder(order)}
                          className="text-xs text-teal-700 hover:underline font-medium">
                          Details
                        </button>

                        {order.status === 'draft' && (
                          <button onClick={() => handleSubmit(order)}
                            className="text-xs text-teal-700 hover:underline">Submit</button>
                        )}
                        {order.status === 'ready_to_send' && (
                          <button onClick={() => setEmailOrder(order)}
                            className="text-xs font-semibold text-green-700 hover:underline">Send</button>
                        )}
                        {order.status === 'sent' && canAdvance && (
                          <button onClick={() => setActionModal({ type: 'acknowledge', order })}
                            className="text-xs text-teal-600 hover:underline">Acknowledge</button>
                        )}
                        {order.status === 'supplier_acknowledged' && canAdvance && (
                          <button onClick={() => setActionModal({ type: 'dispatch', order })}
                            className="text-xs text-teal-600 hover:underline">Dispatched</button>
                        )}
                        {order.status === 'dispatched' && canAdvance && (
                          <button onClick={() => setActionModal({ type: 'receive', order })}
                            className="text-xs font-semibold text-green-700 hover:underline">Receive</button>
                        )}
                        {['ready_to_send', 'sent', 'received'].includes(order.status) && (
                          <button onClick={() => { setPoOrder(order); setPoModalOpen(true); }}
                            className="text-xs text-red-700 hover:underline">PO</button>
                        )}
                        {(order.status === 'draft' || order.status === 'rejected') && (
                          <button onClick={() => setDeleteConfirm(order)}
                            className="text-xs text-red-400 hover:underline opacity-0 group-hover:opacity-100">Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
