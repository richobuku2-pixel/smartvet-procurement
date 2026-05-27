/**
 * utils/po/pdfPO.js
 *
 * Generates a print-ready HTML Purchase Order and opens it in a new browser tab,
 * triggering window.print() automatically for PDF save/print.
 *
 * Exports:
 *   generatePDFPO({ orderNo, orderDate, supplier, supplierDetails, items, paymentTerms })
 *     — Builds the full HTML document string with inline CSS, renders line items
 *       grouped by section with Uganda VAT classification, totals block, signature
 *       boxes, and footer, then opens it via window.open().
 */

import { BUYER, fmt, getVATStatus, calcVATBreakdown } from './helpers';

// ─── PDF / Print PO ───────────────────────────────────────────────────────────
export function generatePDFPO({ orderNo, orderDate, supplier, supplierDetails = {}, items = [], paymentTerms = 'Net 30' }) {
  const activeItems = items.filter(i => (i.qty || 0) > 0);
  const { exemptTotal, standardSubtotal, vat, grandTotal, hasExempt, hasStandard } = calcVATBreakdown(activeItems);

  const sections = [...new Set(activeItems.map(i => i.section))];
  let lineNo = 1;

  const itemRows = sections.map(section => {
    const sectionItems = activeItems.filter(i => i.section === section);
    const hex = sectionItems[0]?.sectionColor || '1F5C6B';

    const secRow = `<tr>
      <td colspan="6" style="background:#${hex};color:#fff;font-weight:700;font-size:7.5pt;
        padding:5px 10px;letter-spacing:0.5px;text-transform:uppercase;">${section}</td>
    </tr>`;

    const prodRows = sectionItems.map(item => {
      const qty   = Number(item.qty) || 0;
      const price = Number(item.unitPrice) || 0;
      const isEquip = getVATStatus(item) === 'standard';
      return `<tr>
        <td class="num">${lineNo++}</td>
        <td class="pc"><strong>${item.name}</strong>
          ${item.spec ? `<br><span class="spec">${item.spec}</span>` : ''}
          ${isEquip ? `<br><span class="vat-badge">Equipment — 18% VAT</span>` : `<span class="exempt-badge">VAT Exempt</span>`}
        </td>
        <td class="ctr">${item.unit || ''}</td>
        <td class="rt">${qty.toLocaleString()}</td>
        <td class="rt">${price ? price.toLocaleString() : '—'}</td>
        <td class="rt bold">${qty && price ? (qty * price).toLocaleString() : '—'}</td>
      </tr>`;
    }).join('');

    return secRow + prodRows;
  }).join('');

  const totalsRows = [];
  if (hasExempt)   totalsRows.push(`<tr class="t-row"><td>Exempt Supplies (Drugs &amp; Vaccines)</td><td class="rt">UGX ${fmt(exemptTotal)}</td></tr>`);
  if (hasStandard) totalsRows.push(`<tr class="t-row"><td>Equipment Subtotal</td><td class="rt">UGX ${fmt(standardSubtotal)}</td></tr>`);
  if (hasStandard) totalsRows.push(`<tr class="t-row"><td>VAT 18% on Equipment</td><td class="rt">UGX ${fmt(vat)}</td></tr>`);
  totalsRows.push(`<tr class="grand"><td>GRAND TOTAL (UGX)</td><td class="rt">UGX ${fmt(grandTotal)}</td></tr>`);

  const vatNote = hasExempt
    ? `<p class="vat-note">* Veterinary drugs &amp; vaccines are <strong>VAT Exempt</strong> per Uganda VAT Act (Cap 349), Second Schedule. Equipment items attract 18% VAT. Confirm current rates with URA at <em>ura.go.ug</em>.</p>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Purchase Order — ${orderNo}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Arial,sans-serif;font-size:9.5pt;color:#1a1a1a;background:#fff}
  .page{padding:16mm 16mm 14mm;max-width:210mm;margin:0 auto}

  /* ── Header ── */
  .hd-accent{height:5px;background:linear-gradient(90deg,#14532d,#0f766e);margin-bottom:0}
  .hd{display:flex;justify-content:space-between;align-items:flex-start;
      background:linear-gradient(135deg,#14532d 0%,#0f766e 100%);
      padding:18px 22px 14px;margin-bottom:0}
  .hd-left h1{font-size:24pt;font-weight:900;color:#fff;letter-spacing:-.5px;line-height:1}
  .hd-left .tag{font-size:8pt;color:#a7f3d0;margin-top:3px;font-style:italic}
  .hd-left .sub{font-size:7.5pt;color:#6ee7b7;margin-top:1px}
  .hd-right{text-align:right}
  .hd-right .pol{font-size:14pt;font-weight:700;color:#c8973a;letter-spacing:1px}
  .hd-right .po-num{font-size:10pt;font-weight:700;color:#fff;margin-top:4px}
  .hd-right p{font-size:8pt;color:#a7f3d0;margin-top:2px}
  .hd-gold{height:4px;background:#c8973a;margin-bottom:14px}

  /* ── Parties ── */
  .parties{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
  .party{border:1px solid #e0e0e0;border-radius:6px;padding:10px 13px;background:#fafafa;
         border-top:3px solid #14532d}
  .party .lbl{font-size:6pt;font-weight:700;text-transform:uppercase;color:#14532d;
               letter-spacing:1.2px;margin-bottom:4px}
  .party .nm{font-size:10.5pt;font-weight:700;color:#1a1a1a;margin-bottom:3px}
  .party p{font-size:8pt;color:#555;line-height:1.5}
  .party .web{color:#0f766e;font-style:italic}

  /* ── Terms bar ── */
  .terms{display:flex;gap:16px;flex-wrap:wrap;background:#14532d;color:#fff;
         border-radius:5px;padding:7px 14px;margin-bottom:12px;font-size:8pt}
  .terms .item{display:flex;flex-direction:column;gap:1px}
  .terms .lbl2{opacity:.65;font-size:7pt;text-transform:uppercase;letter-spacing:.4px}
  .terms .val{font-weight:700;font-size:8.5pt}

  /* ── Table ── */
  table{width:100%;border-collapse:collapse;font-size:8.5pt}
  thead tr{background:#14532d;color:#fff}
  thead th{padding:6px 9px;font-size:7.5pt;font-weight:600;text-transform:uppercase;letter-spacing:.4px}
  thead th.rt{text-align:right}
  thead th.ctr{text-align:center}
  tbody tr{border-bottom:1px solid #f0f0f0}
  tbody tr:nth-child(even){background:#fafafa}
  tbody td{padding:5px 9px;vertical-align:top}
  .num{color:#bbb;font-size:7.5pt;text-align:center;width:26px}
  .pc{max-width:220px}
  .spec{color:#888;font-size:7.5pt}
  .vat-badge{display:inline-block;background:#fff8e1;color:#856404;font-size:6pt;
             padding:1px 5px;border-radius:3px;margin-top:2px;font-weight:600}
  .exempt-badge{display:inline-block;background:#dcfce7;color:#14532d;font-size:6pt;
                padding:1px 5px;border-radius:3px;margin-top:2px;margin-left:4px;font-weight:600}
  .ctr{text-align:center}.rt{text-align:right}.bold{font-weight:600}

  /* ── Totals ── */
  .tw{display:flex;justify-content:flex-end;margin-top:10px}
  .tt{width:310px;border:1px solid #e0e0e0;border-radius:5px;overflow:hidden}
  .tt td{padding:5px 12px;font-size:9pt}
  .t-row{border-top:1px solid #eee}
  .t-row td{color:#444}
  .grand{background:#14532d;color:#fff;font-weight:700;font-size:10pt}
  .grand .rt{color:#c8973a}

  /* ── Notes / Footer ── */
  .vat-note{font-size:7pt;color:#555;margin-top:8px;padding:6px 10px;
            background:#f0fdf4;border-left:3px solid #14532d;border-radius:3px}
  .sig{display:flex;gap:24px;margin-top:18px;padding-top:12px;border-top:1px solid #ddd}
  .sig-box{flex:1;padding:10px 12px;border:1px dashed #ccc;border-radius:4px}
  .sig-box .sig-lbl{font-size:7pt;font-weight:700;text-transform:uppercase;color:#14532d;
                    letter-spacing:.8px;margin-bottom:20px}
  .sig-box .sig-name{font-size:7.5pt;color:#666;border-top:1px solid #ccc;
                     padding-top:4px;margin-top:4px}
  .footer-accent{height:4px;background:linear-gradient(90deg,#14532d,#0f766e);
                 margin-top:14px;border-radius:2px}
  .footer{display:flex;justify-content:space-between;align-items:center;
          padding-top:7px;font-size:7pt;color:#aaa}
  .footer .brand{font-weight:600;color:#14532d;font-size:7.5pt}

  @media print{.page{padding:10mm}@page{size:A4;margin:10mm}}
</style>
</head>
<body>
<div class="page">
  <div class="hd-accent"></div>
  <div class="hd">
    <div class="hd-left">
      <h1>SmartVet Africa</h1>
      <div class="tag">${BUYER.tagline}</div>
      <div class="sub">${BUYER.address} &bull; ${BUYER.web}</div>
    </div>
    <div class="hd-right">
      <div class="pol">PURCHASE ORDER</div>
      <div class="po-num">${orderNo}</div>
      <p>${orderDate}</p>
    </div>
  </div>
  <div class="hd-gold"></div>

  <div class="parties">
    <div class="party">
      <div class="lbl">Buyer</div>
      <div class="nm">${BUYER.name}</div>
      <p>${BUYER.address}</p>
      <p>Contact: ${BUYER.contact} &bull; Tel: ${BUYER.phone}</p>
      <p>${BUYER.email} &bull; <span class="web">${BUYER.web}</span></p>
    </div>
    <div class="party">
      <div class="lbl">Supplier</div>
      <div class="nm">${supplier}</div>
      ${supplierDetails.address || supplierDetails.location ? `<p>${supplierDetails.address || supplierDetails.location}</p>` : ''}
      ${supplierDetails.phone ? `<p>Tel: ${supplierDetails.phone}${supplierDetails.mobilePhone ? ' &bull; ' + supplierDetails.mobilePhone : ''}</p>` : ''}
      ${supplierDetails.contactEmail ? `<p>${supplierDetails.contactEmail}</p>` : ''}
      ${supplierDetails.contactPerson ? `<p>Attn: <strong>${supplierDetails.contactPerson}</strong></p>` : ''}
    </div>
  </div>

  <div class="terms">
    <div class="item"><span class="lbl2">PO Number</span><span class="val">${orderNo}</span></div>
    <div class="item"><span class="lbl2">Order Date</span><span class="val">${orderDate}</span></div>
    <div class="item"><span class="lbl2">Payment Terms</span><span class="val">${paymentTerms}</span></div>
    <div class="item"><span class="lbl2">Line Items</span><span class="val">${activeItems.length}</span></div>
    <div class="item"><span class="lbl2">Currency</span><span class="val">UGX</span></div>
  </div>

  <table>
    <thead><tr>
      <th style="width:26px">#</th>
      <th style="text-align:left">Product / Description</th>
      <th class="ctr" style="width:55px">Unit</th>
      <th class="rt" style="width:45px">Qty</th>
      <th class="rt" style="width:105px">Unit Price (UGX)</th>
      <th class="rt" style="width:105px">Amount (UGX)</th>
    </tr></thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="tw">
    <table class="tt">${totalsRows.join('')}</table>
  </div>

  ${vatNote}

  <div class="sig">
    <div class="sig-box">
      <div class="sig-lbl">Authorised by (Buyer)</div>
      <div class="sig-name">${BUYER.contact} — ${BUYER.name}</div>
    </div>
    <div class="sig-box">
      <div class="sig-lbl">Received by (Supplier)</div>
      <div class="sig-name">${supplier}</div>
    </div>
  </div>

  <div class="footer-accent"></div>
  <div class="footer">
    <span class="brand">${BUYER.name} &mdash; ${BUYER.tagline}</span>
    <span>Generated ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} &bull; Official Purchase Order — retain for records</span>
  </div>
</div>
<script>window.onload=function(){window.print()}</script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=920,height=720');
  if (win) { win.document.write(html); win.document.close(); }
  else alert('Pop-up blocked. Please allow pop-ups and try again.');
}
