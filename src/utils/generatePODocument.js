/**
 * SmartVet Africa — PO Document Generator
 *
 * ── Uganda VAT Position (VAT Act Cap 349, Second Schedule) ──────────────────
 * Veterinary drugs, medicines & vaccines → VAT EXEMPT (0%)
 * Veterinary equipment & supplies (syringes, ear tags, drenchers) → 18% Standard
 *
 * Source: Uganda Revenue Authority / VAT Act Cap 349 Second Schedule
 * "Drugs and medicines" covers veterinary pharmaceuticals per URA position.
 * Confirm current rates at ura.go.ug before filing.
 * ────────────────────────────────────────────────────────────────────────────
 */

import * as XLSX from 'xlsx';

export const BUYER = {
  name:    'SmartVet Africa',
  address: 'Dark Store — Gulu, Northern Uganda',
  contact: 'Richard Obuku',
  web:     'smartvetafrica.com',
};

const VAT_RATE = 0.18;

// Keywords that indicate equipment/supplies (standard-rated at 18% VAT)
const EQUIPMENT_KEYWORDS = [
  'equipment', 'supplies', 'syringe', 'applicator', 'ear tag', 'eartag',
  'drencher', 'drench gun', 'instrument', 'needle', 'clip', 'injector',
  'bolus gun', 'tag', 'applicator', 'tagger', 'hardware', 'consumable',
];

/**
 * Classify a catalogue item for Uganda VAT purposes.
 * Returns 'exempt' (drugs/vaccines/medicines) or 'standard' (equipment/supplies).
 */
export function getVATStatus(item) {
  const text = ((item.section || '') + ' ' + (item.name || '')).toLowerCase();
  return EQUIPMENT_KEYWORDS.some(kw => text.includes(kw)) ? 'standard' : 'exempt';
}

/**
 * Calculate full VAT breakdown for a list of items.
 * Respects Uganda's split: exempt (drugs/vaccines) vs standard (equipment).
 */
export function calcVATBreakdown(items) {
  let exemptTotal = 0;
  let standardSubtotal = 0;

  for (const item of items) {
    const line = (Number(item.qty) || 0) * (Number(item.unitPrice) || 0);
    if (getVATStatus(item) === 'exempt') exemptTotal += line;
    else standardSubtotal += line;
  }

  const vat = Math.round(standardSubtotal * VAT_RATE);
  const grandTotal = exemptTotal + standardSubtotal + vat;
  const hasExempt   = exemptTotal > 0;
  const hasStandard = standardSubtotal > 0;

  return { exemptTotal, standardSubtotal, vat, grandTotal, hasExempt, hasStandard };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n) {
  return typeof n === 'number' && !isNaN(n) ? n.toLocaleString('en-UG') : '0';
}

/** Derive a 2-letter supplier code (e.g. "Global Vet" → "GV") */
export function getSupplierCode(name = '') {
  const SKIP = new Set(['ltd', 'limited', 'and', 'the', 'of', 'co', 'inc', 'corp', 'u', '(u)', 'vet', 'chem']);
  const words = name.split(/[\s().]+/).filter(w => w.length >= 2 && !SKIP.has(w.toLowerCase()));
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

/** Auto-generate a PO number */
export function generateOrderNo(supplierName = '', existingOrders = []) {
  const code = getSupplierCode(supplierName);
  const existing = existingOrders.filter(o => o.supplier === supplierName);
  const seq = String(existing.length + 1).padStart(3, '0');
  return `SV-${code}-${seq}`;
}


// ─── Excel PO ─────────────────────────────────────────────────────────────────
export function generateExcelPO({ orderNo, orderDate, supplier, supplierDetails = {}, items = [], paymentTerms = 'Net 30' }) {
  const wb = XLSX.utils.book_new();
  const rows = [];

  rows.push(['PURCHASE ORDER', '', '', '', '', '', '']);
  rows.push([]);
  rows.push(['FROM (BUYER)', '', '', 'TO (SUPPLIER)', '', '', '']);
  rows.push([BUYER.name, '', '', supplier, '', '', '']);
  rows.push([BUYER.address, '', '', supplierDetails.address || supplierDetails.location || '', '', '', '']);
  rows.push([`Contact: ${BUYER.contact}`, '', '', `Tel: ${supplierDetails.phone || ''}${supplierDetails.mobilePhone ? ' / ' + supplierDetails.mobilePhone : ''}`, '', '', '']);
  rows.push([BUYER.web, '', '', supplierDetails.contactEmail || '', '', '', '']);
  if (supplierDetails.contactPerson) rows.push(['', '', '', `Attn: ${supplierDetails.contactPerson}`, '', '', '']);
  rows.push([]);
  rows.push(['Order No:', orderNo, '', 'Date:', orderDate, '', '']);
  rows.push(['Payment Terms:', paymentTerms, '', '', '', '', '']);
  rows.push([]);
  rows.push(['#', 'Section / Product Description', 'Spec', 'Unit', 'Qty', 'Unit Price (UGX)', 'Amount (UGX)']);

  const sections = [...new Set(items.map(i => i.section))];
  let lineNo = 1;

  for (const section of sections) {
    const sectionItems = items.filter(i => i.section === section && (i.qty || 0) > 0);
    if (!sectionItems.length) continue;
    rows.push(['', section, '', '', '', '', '']);
    for (const item of sectionItems) {
      const qty = Number(item.qty) || 0;
      const price = Number(item.unitPrice) || 0;
      const isEquip = getVATStatus(item) === 'standard';
      rows.push([
        lineNo++,
        item.name + (isEquip ? ' [Equipment]' : ''),
        item.spec || '',
        item.unit || '',
        qty,
        price,
        qty * price,
      ]);
    }
  }

  const { exemptTotal, standardSubtotal, vat, grandTotal, hasExempt, hasStandard } = calcVATBreakdown(items);

  rows.push([]);
  if (hasExempt)   rows.push(['', '', '', '', '', 'Exempt Supplies — Drugs & Vaccines (Uganda VAT Act Cap 349)', exemptTotal]);
  if (hasStandard) rows.push(['', '', '', '', '', 'Equipment / Standard-Rated Subtotal', standardSubtotal]);
  if (hasStandard) rows.push(['', '', '', '', '', `VAT 18% on Equipment`, vat]);
  rows.push(['', '', '', '', '', 'GRAND TOTAL (UGX)', grandTotal]);
  rows.push([]);
  if (hasExempt)   rows.push(['', '', '', '', '', '* Drugs & vaccines are VAT Exempt per Uganda VAT Act (Cap 349), Second Schedule', '']);
  rows.push(['', '', '', '', '', 'Generated by SmartVet Procurement System', new Date().toLocaleDateString('en-GB')]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 5 }, { wch: 44 }, { wch: 20 }, { wch: 10 }, { wch: 8 }, { wch: 34 }, { wch: 22 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Purchase Order');
  XLSX.writeFile(wb, `SmartVet_PO_${orderNo}_${(orderDate || '').replace(/-/g, '')}.xlsx`, { cellStyles: true });
}


// ─── PDF PO ───────────────────────────────────────────────────────────────────
export function generatePDFPO({ orderNo, orderDate, supplier, supplierDetails = {}, items = [], paymentTerms = 'Net 30' }) {
  const activeItems = items.filter(i => (i.qty || 0) > 0);
  const { exemptTotal, standardSubtotal, vat, grandTotal, hasExempt, hasStandard } = calcVATBreakdown(activeItems);

  const sections = [...new Set(activeItems.map(i => i.section))];
  let lineNo = 1;

  const itemRows = sections.map(section => {
    const sectionItems = activeItems.filter(i => i.section === section);
    const hex = sectionItems[0]?.sectionColor || '2D5A2D';

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
        <td class="rt">${price.toLocaleString()}</td>
        <td class="rt bold">${(qty * price).toLocaleString()}</td>
      </tr>`;
    }).join('');

    return secRow + prodRows;
  }).join('');

  // Build totals section
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
  .page{padding:18mm 16mm 14mm;max-width:210mm;margin:0 auto}

  .hd{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #8B0000;padding-bottom:14px;margin-bottom:16px}
  .hd-left h1{font-size:22pt;font-weight:900;color:#8B0000;letter-spacing:-.5px}
  .hd-left p{font-size:8pt;color:#666;margin-top:2px}
  .hd-right{text-align:right}
  .hd-right .pol{font-size:13pt;font-weight:700;color:#8B0000;letter-spacing:1px}
  .hd-right p{font-size:8.5pt;color:#444;margin-top:3px}

  .parties{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:14px}
  .party{border:1px solid #e0e0e0;border-radius:6px;padding:11px 13px;background:#fafafa}
  .party .lbl{font-size:6.5pt;font-weight:700;text-transform:uppercase;color:#8B0000;letter-spacing:1.2px;margin-bottom:5px}
  .party .nm{font-size:10.5pt;font-weight:700;color:#1a1a1a;margin-bottom:3px}
  .party p{font-size:8pt;color:#555;line-height:1.5}

  .terms{display:flex;gap:20px;background:#8B0000;color:#fff;border-radius:5px;padding:7px 14px;margin-bottom:14px;font-size:8pt}
  .terms span{opacity:.75}.terms strong{opacity:1;font-weight:600}

  table{width:100%;border-collapse:collapse;font-size:8.5pt}
  thead tr{background:#8B0000;color:#fff}
  thead th{padding:6px 9px;font-size:7.5pt;font-weight:600;text-transform:uppercase;letter-spacing:.4px}
  thead th.rt{text-align:right}.thead th.ctr{text-align:center}
  tbody tr{border-bottom:1px solid #f0f0f0}
  tbody tr:nth-child(even){background:#fdfafa}
  tbody td{padding:5px 9px;vertical-align:top}
  .num{color:#aaa;font-size:7.5pt;text-align:center;width:28px}
  .pc{max-width:230px}
  .spec{color:#888;font-size:7.5pt}
  .vat-badge{display:inline-block;background:#fff3cd;color:#856404;font-size:6.5pt;padding:1px 5px;border-radius:3px;margin-top:2px;font-weight:600}
  .exempt-badge{display:inline-block;background:#d4edda;color:#155724;font-size:6.5pt;padding:1px 5px;border-radius:3px;margin-top:2px;margin-left:4px;font-weight:600}
  .ctr{text-align:center}.rt{text-align:right}.bold{font-weight:600}

  .tw{display:flex;justify-content:flex-end;margin-top:10px}
  .tt{width:300px;border:1px solid #e8e8e8;border-radius:5px;overflow:hidden}
  .tt td{padding:5px 12px;font-size:9pt}
  .t-row{border-top:1px solid #eee}
  .grand{background:#8B0000;color:#fff;font-weight:700;font-size:10pt}

  .vat-note{font-size:7pt;color:#555;margin-top:8px;padding:6px 10px;background:#f8f9e8;border-left:3px solid #8B8000;border-radius:3px}

  .footer{margin-top:18px;border-top:1px solid #ddd;padding-top:9px;display:flex;justify-content:space-between;font-size:7pt;color:#aaa}

  @media print{.page{padding:10mm}@page{size:A4;margin:12mm}}
</style>
</head>
<body>
<div class="page">
  <div class="hd">
    <div class="hd-left"><h1>SmartVet Africa</h1><p>${BUYER.address} &bull; ${BUYER.web}</p></div>
    <div class="hd-right">
      <div class="pol">PURCHASE ORDER</div>
      <p><strong>PO #:</strong> ${orderNo}</p>
      <p><strong>Date:</strong> ${orderDate}</p>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <div class="lbl">Bill From (Buyer)</div>
      <div class="nm">${BUYER.name}</div>
      <p>${BUYER.address}</p>
      <p>Contact: ${BUYER.contact} &bull; ${BUYER.web}</p>
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
    <div><span>Payment Terms: </span><strong>${paymentTerms}</strong></div>
    <div><span>Order Date: </span><strong>${orderDate}</strong></div>
    <div><span>PO Number: </span><strong>${orderNo}</strong></div>
    <div><span>Items: </span><strong>${activeItems.length}</strong></div>
  </div>

  <table>
    <thead><tr>
      <th style="width:28px">#</th><th>Product / Description</th>
      <th class="ctr" style="width:55px">Unit</th>
      <th class="rt" style="width:50px">Qty</th>
      <th class="rt" style="width:110px">Unit Price (UGX)</th>
      <th class="rt" style="width:110px">Amount (UGX)</th>
    </tr></thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="tw">
    <table class="tt">${totalsRows.join('')}</table>
  </div>

  ${vatNote}

  <div class="footer">
    <span>Generated by SmartVet Procurement System &bull; ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
    <span>Official Purchase Order — retain for records.</span>
  </div>
</div>
<script>window.onload=function(){window.print()}</script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  if (win) { win.document.write(html); win.document.close(); }
  else alert('Pop-up blocked. Please allow pop-ups and try again.');
}
