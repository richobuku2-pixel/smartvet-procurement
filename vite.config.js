import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load ALL .env variables (no prefix filter) — these stay server-side only
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),

      // ── Zoho Mail API endpoint ─────────────────────────────────────────────
      // Runs in Node.js (Vite dev server). The app password never reaches the browser.
      {
        name: 'smartvet-email-api',
        configureServer(server) {
          // ── Gemini AI price/availability parser ───────────────────────────
          server.middlewares.use('/api/parse-prices-ai', async (req, res) => {
            res.setHeader('Content-Type', 'application/json');
            if (req.method !== 'POST') { res.statusCode = 405; res.end(JSON.stringify({ error: 'Method not allowed' })); return; }

            const apiKey = env.GEMINI_API_KEY;
            if (!apiKey) { res.statusCode = 500; res.end(JSON.stringify({ error: 'GEMINI_API_KEY not set in .env' })); return; }

            let raw = '';
            for await (const chunk of req) raw += chunk;
            let body;
            try { body = JSON.parse(raw); } catch { res.statusCode = 400; res.end(JSON.stringify({ error: 'Invalid JSON' })); return; }

            const { text, catalogue, mode = 'price' } = body;
            if (!text?.trim() || !catalogue?.length) { res.statusCode = 400; res.end(JSON.stringify({ error: 'Missing text or catalogue' })); return; }

            const catalogueList = catalogue.map(i => `  ID:"${i.id}"  Name:"${i.name}"${i.unit ? `  Unit:${i.unit}` : ''}`).join('\n');

            const prompt = mode === 'price'
              ? `You are a price extraction assistant for SmartVet Africa, Uganda. Currency: UGX.\n\nCATALOGUE:\n${catalogueList}\n\nSUPPLIER TEXT:\n${text}\n\nINSTRUCTIONS:\n- Category on one line + dose+price below = "CATEGORY DOSE" product. E.g. "NCD" then "1000DS @6500" = "NCD 1000DS" at 6500.\n- Use first price when two appear ("@6500 and 15,000" → 6500).\n- Return prices as plain integers. Only confident matches.\n\nReturn ONLY a JSON array:\n[{"catalogueId":"...","productName":"...","unitPrice":6500}]`
              : `You are an availability assistant for SmartVet Africa, Uganda.\n\nCATALOGUE:\n${catalogueList}\n\nSUPPLIER TEXT:\n${text}\n\nINSTRUCTIONS:\n- Status: exactly "in_stock", "low_stock", or "out_of_stock".\n- tight/limited/few = low_stock. finished/out/nil = out_of_stock.\n- Only explicitly mentioned products.\n\nReturn ONLY a JSON array:\n[{"productId":"...","productName":"...","status":"in_stock"}]`;

            try {
              const gRes = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
                { method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 1024 } }),
                  signal: AbortSignal.timeout(20000) }
              );
              if (!gRes.ok) { res.statusCode = 502; res.end(JSON.stringify({ error: `Gemini ${gRes.status}` })); return; }
              const data = await gRes.json();
              const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
              const jsonMatch = rawText.match(/\[[\s\S]*?\]/);
              const items = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
              res.statusCode = 200; res.end(JSON.stringify({ ok: true, items, model: 'gemini-2.0-flash', mode }));
            } catch (err) {
              res.statusCode = 500; res.end(JSON.stringify({ error: err.message }));
            }
          });

          // ── Price scraper proxy ────────────────────────────────────────────
          server.middlewares.use('/api/scrape-prices', async (req, res) => {
            res.setHeader('Content-Type', 'application/json');
            if (req.method !== 'GET') { res.statusCode = 405; res.end(JSON.stringify({ error: 'Method not allowed' })); return; }
            const rawUrl = new URL(req.url, 'http://localhost').searchParams.get('url');
            if (!rawUrl) { res.statusCode = 400; res.end(JSON.stringify({ error: 'Missing ?url= parameter' })); return; }
            try {
              new URL(rawUrl); // validate
              const resp = await fetch(rawUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SmartVetPriceBot/1.0)', 'Accept': 'text/html,text/plain,*/*' },
                signal: AbortSignal.timeout(15000),
              });
              if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
              const html = await resp.text();
              const text = html
                .replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '')
                .replace(/<br\s*\/?>/gi, '\n').replace(/<\/(?:p|div|tr|li|h[1-6])>/gi, '\n')
                .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&#?[a-z0-9]+;/gi, ' ')
                .split('\n').map(l => l.trim()).filter(Boolean).join('\n');
              res.statusCode = 200;
              res.end(JSON.stringify({ ok: true, text, url: rawUrl }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });

          server.middlewares.use('/api/send-reset', async (req, res) => {
            res.setHeader('Content-Type', 'application/json');

            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end(JSON.stringify({ error: 'Method not allowed' }));
              return;
            }

            // Collect request body
            let raw = '';
            for await (const chunk of req) raw += chunk;
            let body;
            try { body = JSON.parse(raw); } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON body' }));
              return;
            }

            const { to, name, resetLink } = body;
            if (!to || !resetLink) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Missing required fields: to, resetLink' }));
              return;
            }

            const fromEmail = env.ZOHO_FROM_EMAIL || 'hello@smartvet.africa';
            const appPass   = env.ZOHO_APP_PASSWORD;

            if (!appPass) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'ZOHO_APP_PASSWORD not configured in .env' }));
              return;
            }

            try {
              const { default: nodemailer } = await import('nodemailer');

              const transporter = nodemailer.createTransport({
                host: 'smtp.zoho.com',
                port: 587,
                secure: false,
                requireTLS: true,
                connectionTimeout: 15000,
                greetingTimeout: 10000,
                socketTimeout: 20000,
                authMethod: 'LOGIN',
                auth: { user: fromEmail, pass: appPass },
                tls: { rejectUnauthorized: true },
              });

              const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#14532d,#0f766e);padding:28px 32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;letter-spacing:0.5px;">SmartVet Africa</h1>
            <p style="margin:4px 0 0;color:#a7f3d0;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Procurement System</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 8px;font-size:15px;color:#374151;">Hi <strong>${name || to}</strong>,</p>
            <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.6;">
              We received a request to reset the password for your SmartVet Africa account.
              Click the button below to set a new password. This link expires in <strong>1 hour</strong>.
            </p>
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr><td align="center" style="padding:8px 0 24px;">
                <a href="${resetLink}" style="display:inline-block;background:linear-gradient(135deg,#15803d,#0d9488);color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 36px;border-radius:8px;">
                  Reset My Password
                </a>
              </td></tr>
            </table>
            <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;">If the button doesn't work, copy and paste this link:</p>
            <p style="margin:0 0 24px;font-size:11px;color:#6b7280;word-break:break-all;">
              <a href="${resetLink}" style="color:#0d9488;">${resetLink}</a>
            </p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 20px;"/>
            <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
              If you didn't request a password reset, you can safely ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:11px;color:#9ca3af;">© ${new Date().getFullYear()} SmartVet Africa · Kampala, Uganda</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

              const text = `Hi ${name || to},\n\nReset your SmartVet Africa password:\n${resetLink}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, ignore this email.\n\n— SmartVet Africa`;

              await transporter.sendMail({
                from: `"SmartVet Africa" <${fromEmail}>`,
                to,
                subject: 'SmartVet Africa — Password Reset Request',
                html,
                text,
              });

              console.log(`[Email] Password reset sent → ${to}`);
              res.statusCode = 200;
              res.end(JSON.stringify({ ok: true }));

            } catch (err) {
              const detail = `${err.code ? err.code + ': ' : ''}${err.message}`;
              console.error('[Email] Send failed:', detail);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to send email', detail }));
            }
          });
        },
      },
    ],
  };
});
