/**
 * smsService.js — Delivery SMS notifications via Message Carrier Africa
 *
 * Returns a log entry from each send so AppContext can persist the comms record.
 * All messages kept under 160 characters (1 SMS unit).
 */

const TEMPLATES = {
  confirmed: (o) =>
    `SmartVet: Order ${o.soNumber} confirmed! ${o.items?.length || 0} item(s) to ${o.deliveryZone}.${o.expectedDelivery ? ` Expected: ${o.expectedDelivery}.` : ''}`,

  picking: (o) =>
    `SmartVet: Order ${o.soNumber} is being picked & packed at our warehouse. We'll update you when ready for dispatch.`,

  packed: (o) =>
    `SmartVet: Order ${o.soNumber} is packed and ready for dispatch. Delivery coming soon!`,

  dispatched: (o, rider) =>
    `SmartVet: Order ${o.soNumber} dispatched!${rider?.name ? ` Rider: ${rider.name}` : ''}${rider?.phone ? ` — call: ${rider.phone}` : ''}.`,

  in_transit: (o, rider) =>
    `SmartVet: Order ${o.soNumber} is on its way!${rider?.name && rider?.phone ? ` Your rider is ${rider.name} — call: ${rider.phone}.` : ' Rider is en route.'}`,

  delivered: (o) =>
    `SmartVet: Order ${o.soNumber} delivered! Thank you for choosing SmartVet Africa. For any issues, contact us promptly.`,

  failed: (o) =>
    `SmartVet: We couldn't complete delivery of order ${o.soNumber}. Our team will contact you to reschedule.`,

  cancelled: (o) =>
    `SmartVet: Order ${o.soNumber} has been cancelled. Contact SmartVet Africa for assistance.`,

  rescheduled: (o) =>
    `SmartVet: Delivery of order ${o.soNumber} has been rescheduled.${o.expectedDelivery ? ` New date: ${o.expectedDelivery}.` : ''} Our team will be in touch.`,
};

// ── Core send ─────────────────────────────────────────────────────────────────
async function _send(phone, message) {
  const to = phone.trim().startsWith('+') ? phone.trim() : `+${phone.trim().replace(/^0/, '256')}`;
  const logEntry = { phone: to, message, sentAt: new Date().toISOString(), status: 'sending' };
  try {
    const res  = await fetch('/api/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: to, message }),
    });
    const data = await res.json().catch(() => ({}));
    logEntry.status = (data.ok) ? 'sent' : 'failed';
    logEntry.reason = data.reason || data.error || null;
  } catch (err) {
    logEntry.status = 'failed';
    logEntry.reason = err.message;
  }
  return logEntry;
}

/**
 * Send a status-change SMS. Returns a log entry { phone, message, sentAt, status, reason }.
 */
export async function sendDeliverySMS(phone, status, order, rider = null) {
  const fn = TEMPLATES[status];
  if (!fn || !phone?.trim()) return null;
  return _send(phone, fn(order, rider));
}

/**
 * Send a fully custom message (manual comms from the Communications tab).
 */
export async function sendCustomSMS(phone, message) {
  if (!phone?.trim() || !message?.trim()) return null;
  return _send(phone, message.trim());
}
