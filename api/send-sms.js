/**
 * api/send-sms.js — Message Carrier SMS gateway (Vercel serverless)
 * https://www.messagecarrier.africa
 *
 * Required env var:
 *   MC_API_KEY — Message Carrier live API key
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

  const apiKey = process.env.MC_API_KEY;
  if (!apiKey) {
    console.warn('[SMS] MC_API_KEY not set — SMS skipped');
    return res.status(200).json({ ok: false, reason: 'SMS not configured — set MC_API_KEY in environment' });
  }

  // Normalise phone: ensure + prefix for international format
  const to = phone.trim().startsWith('+') ? phone.trim() : `+${phone.trim().replace(/^0/, '256')}`;

  try {
    const payload = {
      recipient: to,
      message,
      sender_id: 'SmartVet',   // registered sender ID — update if MC requires a different one
    };

    const mcRes = await fetch('https://api.messagecarrier.africa/api/sms/send', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
        'Accept':        'application/json',
      },
      body:   JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    // Log raw response so we can adjust if endpoint/format differs
    const responseText = await mcRes.text();
    let data;
    try { data = JSON.parse(responseText); } catch { data = { raw: responseText }; }

    if (!mcRes.ok) {
      console.error(`[SMS] Message Carrier error ${mcRes.status}:`, responseText);
      return res.status(500).json({ error: data });
    }

    console.log(`[SMS] Sent to ${to}: "${message.slice(0, 50)}…"`, data);
    return res.status(200).json({ ok: true, data });

  } catch (err) {
    console.error('[SMS] Fetch failed:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
