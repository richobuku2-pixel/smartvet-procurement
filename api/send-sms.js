/**
 * api/send-sms.js — Africa's Talking SMS gateway (Vercel serverless)
 *
 * Required env vars:
 *   AT_API_KEY   — Africa's Talking API key (from africastalking.com dashboard)
 *   AT_USERNAME  — Your Africa's Talking username (use 'sandbox' for testing)
 *
 * POST body: { phone: string, message: string }
 */
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone, message } = req.body || {};
  if (!phone || !message) {
    return res.status(400).json({ error: 'phone and message are required' });
  }

  const apiKey   = process.env.AT_API_KEY;
  const username = process.env.AT_USERNAME;

  if (!apiKey || !username) {
    console.warn('[SMS] AT_API_KEY or AT_USERNAME not set — SMS skipped');
    return res.status(200).json({ ok: false, reason: 'SMS not configured' });
  }

  try {
    const body = new URLSearchParams({ username, to: phone, message });

    const atRes = await fetch('https://api.africastalking.com/version1/messaging', {
      method:  'POST',
      headers: {
        apiKey,
        Accept:         'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
      signal: AbortSignal.timeout(10000),
    });

    const data = await atRes.json();

    const recipient = data?.SMSMessageData?.Recipients?.[0];
    if (!atRes.ok || (recipient && recipient.status !== 'Success')) {
      console.error('[SMS] Africa\'s Talking error:', JSON.stringify(data));
      return res.status(500).json({ error: data });
    }

    console.log(`[SMS] Sent to ${phone}: "${message.slice(0, 40)}…"`);
    return res.status(200).json({ ok: true, messageId: recipient?.messageId });

  } catch (err) {
    console.error('[SMS] Fetch failed:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
