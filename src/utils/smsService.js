/**
 * smsService.js — Delivery SMS notifications via Africa's Talking
 *
 * One message per fulfillment status change, sent to the customer's phone.
 * All messages kept under 160 characters (1 SMS unit).
 *
 * Usage:
 *   sendDeliverySMS(phone, status, order, rider?)
 */

// ── Message templates ─────────────────────────────────────────────────────────
const TEMPLATES = {
  confirmed: (o) =>
    `SmartVet: Order ${o.soNumber} confirmed! ` +
    `${o.items?.length || 0} item(s) to ${o.deliveryZone}.` +
    `${o.expectedDelivery ? ` Expected: ${o.expectedDelivery}.` : ''}`,

  picking: (o) =>
    `SmartVet: Order ${o.soNumber} is being picked & packed at our warehouse. We'll update you when it's ready for dispatch.`,

  packed: (o) =>
    `SmartVet: Order ${o.soNumber} is packed and ready for dispatch. Delivery coming soon!`,

  dispatched: (o, rider) =>
    `SmartVet: Order ${o.soNumber} dispatched!` +
    (rider?.name ? ` Rider: ${rider.name}` : '') +
    (rider?.phone ? ` — call: ${rider.phone}` : '') + '.',

  in_transit: (o, rider) =>
    `SmartVet: Order ${o.soNumber} is on its way to you!` +
    (rider?.name && rider?.phone
      ? ` Your rider is ${rider.name} — call: ${rider.phone}.`
      : ' Rider is en route.'),

  delivered: (o) =>
    `SmartVet: Order ${o.soNumber} has been delivered! ` +
    `Thank you for choosing SmartVet Africa. ` +
    `For any issues, please contact us promptly.`,

  failed: (o) =>
    `SmartVet: Unfortunately we couldn't complete delivery of order ${o.soNumber}. ` +
    `Our team will contact you to reschedule.`,

  cancelled: (o) =>
    `SmartVet: Order ${o.soNumber} has been cancelled. ` +
    `Contact SmartVet Africa if you need assistance.`,
};

// ── Send ──────────────────────────────────────────────────────────────────────
/**
 * @param {string} phone    - Customer phone number (e.g. "+256 772 123456")
 * @param {string} status   - Fulfillment status key
 * @param {object} order    - Sales order object (needs soNumber, items, deliveryZone)
 * @param {object} [rider]  - Rider object { name, phone } — used for dispatched/in_transit
 */
export async function sendDeliverySMS(phone, status, order, rider = null) {
  const templateFn = TEMPLATES[status];
  if (!templateFn || !phone?.trim()) return;

  const message = templateFn(order, rider);

  try {
    const res = await fetch('/api/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone.trim(), message }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn('[SMS] Server error:', err);
      return;
    }

    const data = await res.json();
    if (!data.ok) {
      console.warn('[SMS] Not sent:', data.reason || data.error || 'unknown reason');
    }
  } catch (err) {
    // Never throw — SMS failure must not break the UI flow
    console.warn('[SMS] Failed silently:', err.message);
  }
}
