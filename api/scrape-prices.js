/**
 * /api/scrape-prices — Vercel serverless function
 *
 * Fetches a supplier URL and returns cleaned plain text so the
 * client-side price parser can extract product prices without
 * CORS issues.
 *
 * GET /api/scrape-prices?url=https://supplier.com/pricelist
 * Returns: { ok: true, text: "...", url: "..." }
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'GET') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const { url } = req.query;
  if (!url) { res.status(400).json({ error: 'Missing ?url= parameter' }); return; }

  // Basic URL validation — must be http/https
  let parsed;
  try { parsed = new URL(url); } catch {
    res.status(400).json({ error: 'Invalid URL' }); return;
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    res.status(400).json({ error: 'Only http/https URLs allowed' }); return;
  }

  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SmartVetPriceBot/1.0; +https://smartvetafrica.com)',
        'Accept': 'text/html,text/plain,application/xhtml+xml,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(15000),
      redirect: 'follow',
    });

    if (!resp.ok) {
      res.status(502).json({ error: `Supplier site returned HTTP ${resp.status}` }); return;
    }

    const html = await resp.text();

    // Strip scripts, styles, and HTML tags → clean readable text
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(?:p|div|tr|li|h[1-6]|section|article)>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#?[a-z0-9]+;/gi, ' ')
      .replace(/[ \t]{2,}/g, ' ')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0)
      .join('\n');

    res.status(200).json({ ok: true, text, url, lines: text.split('\n').length });

  } catch (err) {
    const msg = err.name === 'TimeoutError'
      ? 'Request timed out (15s). The supplier site may be slow or blocking bots.'
      : err.message;
    res.status(500).json({ error: msg });
  }
}
