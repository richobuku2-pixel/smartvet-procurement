/**
 * /api/parse-prices-ai — Gemini 2.0 Flash powered parser
 *
 * Handles two modes via the `mode` body field:
 *   "price"        → extracts {catalogueId, productName, unitPrice} from supplier text
 *   "availability" → extracts {productId, productName, status} from supplier text
 *
 * The API key stays server-side; catalogue + text are sent from the browser.
 *
 * POST /api/parse-prices-ai
 * Body: { text: string, catalogue: [{id, name, unit?}], mode: 'price'|'availability' }
 */

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST')   { res.status(405).json({ error: 'Method not allowed' }); return; }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY not set in environment variables' });
    return;
  }

  // Parse request body
  let body;
  try {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    body = JSON.parse(raw);
  } catch {
    res.status(400).json({ error: 'Invalid JSON body' }); return;
  }

  const { text, catalogue, mode = 'price' } = body;
  if (!text?.trim())        { res.status(400).json({ error: 'Missing text' }); return; }
  if (!catalogue?.length)   { res.status(400).json({ error: 'Missing catalogue' }); return; }

  // Build catalogue list — only id + name + unit (keep token count low)
  const catalogueList = catalogue
    .map(i => `  ID:"${i.id}"  Name:"${i.name}"${i.unit ? `  Unit:${i.unit}` : ''}`)
    .join('\n');

  const prompt = mode === 'price'
    ? `You are a price extraction assistant for SmartVet Africa, a veterinary procurement company in Uganda. Currency is Uganda Shillings (UGX).

CATALOGUE (match supplier text to these items only):
${catalogueList}

SUPPLIER TEXT:
${text}

INSTRUCTIONS:
- The text may list a product category on one line, then dose sizes and prices below it.
  Example:  "NCD"  then  "1000DS @6500"  means the product "NCD 1000DS" costs UGX 6,500.
- When a line has two prices like "@6500 and 15,000", use the FIRST price (6,500).
- Match each price to the closest catalogue entry using the ID field.
- Return prices as plain integers — no commas, no currency symbols.
- Only include products you are confident about. Skip anything ambiguous.
- If nothing matches, return an empty array.

Return ONLY a valid JSON array with no explanation, markdown, or extra text:
[{"catalogueId":"ER-HV01","productName":"NCD 1000DS","unitPrice":6500}]`

    : `You are an availability extraction assistant for SmartVet Africa, a veterinary procurement company in Uganda.

CATALOGUE (match supplier text to these items only):
${catalogueList}

SUPPLIER TEXT:
${text}

INSTRUCTIONS:
- Extract product availability status from the supplier message.
- Status must be exactly one of: "in_stock", "low_stock", "out_of_stock"
- "tight", "limited", "few left", "running low", "almost finished" → "low_stock"
- "finished", "out", "none", "unavailable", "nil", "zero", "completely gone" → "out_of_stock"
- "available", "in stock", "have", "yes" → "in_stock"
- Only include products explicitly mentioned. Skip anything not in the catalogue.
- If nothing matches, return an empty array.

Return ONLY a valid JSON array with no explanation, markdown, or extra text:
[{"productId":"ER-HV01","productName":"NCD 1000DS","status":"in_stock"}]`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,      // low temp → consistent structured output
            maxOutputTokens: 1024,
          },
        }),
        signal: AbortSignal.timeout(20_000),
      }
    );

    if (!geminiRes.ok) {
      const detail = await geminiRes.text();
      console.error('[Gemini] API error:', geminiRes.status, detail);
      res.status(502).json({ error: `Gemini API returned ${geminiRes.status}`, detail });
      return;
    }

    const data = await geminiRes.json();

    // Gemini 2.5 Flash is a thinking model — it puts reasoning in parts with thought:true
    // and the actual answer in the non-thinking part. Always find the answer part.
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const rawText = (parts.find(p => !p.thought)?.text ?? parts[parts.length - 1]?.text) || '';

    // Extract the JSON array — use greedy match so multi-object arrays aren't truncated
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn('[Gemini] No JSON array in response:', rawText.slice(0, 300));
      res.status(200).json({ ok: true, items: [], warning: 'AI returned no structured data' });
      return;
    }

    let items;
    try {
      items = JSON.parse(jsonMatch[0]);
    } catch (e) {
      res.status(200).json({ ok: true, items: [], warning: 'Could not parse AI response as JSON' });
      return;
    }

    console.log(`[Gemini] ${mode} parse: ${items.length} items from ${text.length} chars`);
    res.status(200).json({ ok: true, items, model: 'gemini-2.5-flash', mode });

  } catch (err) {
    const msg = err.name === 'TimeoutError'
      ? 'Gemini API timed out (20s). Try a shorter text or use Regex Parse instead.'
      : err.message;
    console.error('[Gemini] Error:', msg);
    res.status(500).json({ error: msg });
  }
}
