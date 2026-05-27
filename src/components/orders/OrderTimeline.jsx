/**
 * orders/OrderTimeline.jsx
 *
 * Vertical timeline of all events recorded against a purchase order,
 * with pending future steps shown dimmed at the bottom.
 *
 * Props:
 *   order {Object} — full order object from AppContext
 */

import { ORDER_STATUSES, PO_PIPELINE } from '../../data/seedData';
import { formatDate, formatDateTime } from '../../utils/formatter';

export default function OrderTimeline({ order }) {
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
