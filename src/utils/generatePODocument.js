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

import * as XLSX from 'xlsx-js-style';

export const BUYER = {
  name:    'SmartVet Africa',
  tagline: 'Animal Health meets Innovation',
  address: 'Dark Store — Gulu, Northern Uganda',
  contact: 'Richard Obuku',
  email:   'hello@smartvet.africa',
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
  const ws = {};
  const merges = [];
  const rowHeights = {};
  let maxRow = 0;

  // ── Palette ────────────────────────────────────────────────────────────────
  const C = {
    green:      '14532D',
    greenMid:   '1B6B40',
    greenLight: 'E8F5E9',
    teal:       '0F766E',
    gold:       'C8973A',
    dark:       '1A1A1A',
    white:      'FFFFFF',
    lightGray:  'F8F8F8',
    midGray:    'EEEEEE',
    amber:      'FFF8E1',
    amberDark:  '856404',
    redLight:   'FFF3E0',
  };

  // ── Style helpers ──────────────────────────────────────────────────────────
  const fill  = rgb => ({ patternType: 'solid', fgColor: { rgb } });
  const font  = (bold = false, rgb = '000000', sz = 10, italic = false) =>
    ({ bold, color: { rgb }, sz, italic, name: 'Calibri' });
  const align = (horizontal = 'left', vertical = 'center', wrapText = true) =>
    ({ horizontal, vertical, wrapText });
  const bdr   = (rgb = 'D0D0D0') => {
    const s = { style: 'thin', color: { rgb } };
    return { top: s, bottom: s, left: s, right: s };
  };

  function colLetter(n) {
    let s = ''; n += 1;
    while (n > 0) { s = String.fromCharCode(65 + ((n - 1) % 26)) + s; n = Math.floor((n - 1) / 26); }
    return s;
  }
  function setCell(col, row, cellObj) {
    ws[colLetter(col) + row] = cellObj;
    if (row > maxRow) maxRow = row;
  }
  function mergeRange(sc, sr, ec, er) {
    merges.push({ s: { c: sc, r: sr - 1 }, e: { c: ec, r: er - 1 } });
  }
  function mc(sc, sr, ec, er, cellObj) {
    mergeRange(sc, sr, ec, er);
    setCell(sc, sr, cellObj);
    for (let c = sc; c <= ec; c++)
      for (let r = sr; r <= er; r++)
        if (!(c === sc && r === sr)) ws[colLetter(c) + r] = { t: 's', v: '', s: cellObj.s };
  }

  // ── Row 1: thin teal accent strip ─────────────────────────────────────────
  rowHeights[1] = 5;
  mc(0, 1, 7, 1, { t: 's', v: '', s: { fill: fill(C.teal) } });

  // ── Row 2: Company name + "PURCHASE ORDER" ────────────────────────────────
  rowHeights[2] = 46;
  mc(0, 2, 4, 2, {
    t: 's', v: 'SmartVet Africa',
    s: { fill: fill(C.green), font: font(true, C.white, 24), alignment: align('left', 'center', false) },
  });
  mc(5, 2, 7, 2, {
    t: 's', v: 'PURCHASE ORDER',
    s: { fill: fill(C.green), font: font(true, C.gold, 16), alignment: align('right', 'center', false) },
  });

  // ── Row 3: Tagline + PO number ────────────────────────────────────────────
  rowHeights[3] = 14;
  mc(0, 3, 4, 3, {
    t: 's', v: `  ${BUYER.tagline}  ·  ${BUYER.web}`,
    s: { fill: fill(C.greenMid), font: font(false, 'A7F3D0', 8, true), alignment: align('left', 'center', false) },
  });
  mc(5, 3, 7, 3, {
    t: 's', v: `PO #  ${orderNo}`,
    s: { fill: fill(C.greenMid), font: font(true, C.white, 9), alignment: align('right', 'center', false) },
  });

  // ── Row 4: gold accent ────────────────────────────────────────────────────
  rowHeights[4] = 4;
  mc(0, 4, 7, 4, { t: 's', v: '', s: { fill: fill(C.gold) } });

  // ── Rows 5–8: Buyer details (left) + PO meta (right) ──────────────────────
  const infoRows = [
    [BUYER.address,                              'ORDER DATE:',     orderDate || new Date().toLocaleDateString('en-GB')],
    [`Contact: ${BUYER.contact}`,                'PAYMENT TERMS:',  paymentTerms],
    [`${BUYER.email}  ·  ${BUYER.web}`,          'CURRENCY:',       'Uganda Shillings (UGX)'],
    ['Gulu, Northern Uganda  ·  East Africa',    'REQUIRED BY:',    'To be confirmed'],
  ];
  for (let i = 0; i < infoRows.length; i++) {
    const r = 5 + i;
    rowHeights[r] = 14;
    mc(0, r, 4, r, {
      t: 's', v: '  ' + infoRows[i][0],
      s: { fill: fill('F7FBF7'), font: font(false, '444444', 9), alignment: align('left', 'center', false) },
    });
    mc(5, r, 6, r, {
      t: 's', v: infoRows[i][1],
      s: { fill: fill('EDF7ED'), font: font(true, C.green, 8), alignment: align('right', 'center', false) },
    });
    setCell(7, r, {
      t: 's', v: infoRows[i][2],
      s: { fill: fill('EDF7ED'), font: font(true, '003300', 9), alignment: align('left', 'center', false) },
    });
  }

  // ── Row 9: separator ──────────────────────────────────────────────────────
  rowHeights[9] = 4;
  mc(0, 9, 7, 9, { t: 's', v: '', s: { fill: fill(C.midGray) } });

  // ── Row 10: SUPPLIER section label ────────────────────────────────────────
  rowHeights[10] = 14;
  mc(0, 10, 7, 10, {
    t: 's', v: '  SUPPLIER DETAILS',
    s: { fill: fill(C.dark), font: font(true, C.white, 8), alignment: align('left', 'center', false) },
  });

  // ── Rows 11–13: Supplier info ─────────────────────────────────────────────
  const suppLines = [
    [supplier,                                                                     ''],
    [supplierDetails.address || supplierDetails.location || '',                    supplierDetails.contactEmail || ''],
    [`Tel: ${[supplierDetails.phone, supplierDetails.mobilePhone].filter(Boolean).join(' / ') || 'N/A'}`,
     supplierDetails.contactPerson ? `Attn: ${supplierDetails.contactPerson}` : ''],
  ];
  for (let i = 0; i < suppLines.length; i++) {
    const r = 11 + i;
    rowHeights[r] = 13;
    mc(0, r, 3, r, {
      t: 's', v: '  ' + suppLines[i][0],
      s: { fill: fill('FAFAFA'), font: font(i === 0, C.dark, i === 0 ? 11 : 8), alignment: align('left', 'center', false) },
    });
    mc(4, r, 7, r, {
      t: 's', v: suppLines[i][1],
      s: { fill: fill('FAFAFA'), font: font(false, '555555', 8), alignment: align('left', 'center', false) },
    });
  }

  // ── Row 14: separator ────────────────────────────────────────────────────
  rowHeights[14] = 4;
  mc(0, 14, 7, 14, { t: 's', v: '', s: { fill: fill('CCCCCC') } });

  // ── Row 15: Column headers ────────────────────────────────────────────────
  rowHeights[15] = 22;
  const hdrs = ['#', 'Product / Description', 'Pack Specification', 'Unit', 'Qty', 'Unit Price (UGX)', 'Amount (UGX)', 'VAT'];
  const hdrAligns = ['center', 'left', 'left', 'center', 'center', 'right', 'right', 'center'];
  hdrs.forEach((h, i) => {
    setCell(i, 15, {
      t: 's', v: h,
      s: { fill: fill(C.green), font: font(true, C.white, 9), alignment: align(hdrAligns[i], 'center', false), border: bdr() },
    });
  });

  // ── Item rows ─────────────────────────────────────────────────────────────
  const sections = [...new Set(items.map(it => it.section))];
  let rowIdx = 16;
  let lineNo  = 1;

  for (const section of sections) {
    const sectionItems = items.filter(it => it.section === section && (it.qty || 0) > 0);
    if (!sectionItems.length) continue;

    const secColor = sectionItems[0]?.sectionColor || '1F5C6B';
    rowHeights[rowIdx] = 14;
    mc(0, rowIdx, 7, rowIdx, {
      t: 's', v: `  ${section}`,
      s: { fill: fill(secColor), font: font(true, C.white, 8), alignment: align('left', 'center', false), border: bdr() },
    });
    rowIdx++;

    for (const item of sectionItems) {
      const qty     = Number(item.qty) || 0;
      const price   = Number(item.unitPrice) || 0;
      const isEquip = getVATStatus(item) === 'standard';
      const bg      = lineNo % 2 === 0 ? C.lightGray : C.white;

      rowHeights[rowIdx] = 20;

      setCell(0, rowIdx, { t: 'n', v: lineNo++, s: { fill: fill(bg), font: font(false, 'AAAAAA', 8), alignment: align('center', 'center', false), border: bdr() } });
      setCell(1, rowIdx, { t: 's', v: item.name || '', s: { fill: fill(bg), font: font(true, C.dark, 9), alignment: align('left', 'center', true), border: bdr() } });
      setCell(2, rowIdx, { t: 's', v: item.spec || '', s: { fill: fill(bg), font: font(false, '777777', 8), alignment: align('left', 'center', true), border: bdr() } });
      setCell(3, rowIdx, { t: 's', v: item.unit || '', s: { fill: fill(bg), font: font(false, C.dark, 8), alignment: align('center', 'center', false), border: bdr() } });
      setCell(4, rowIdx, { t: 'n', v: qty, s: { fill: fill(C.greenLight), font: font(true, '1B5E20', 11), alignment: align('center', 'center', false), border: bdr() } });
      setCell(5, rowIdx, { t: qty && price ? 'n' : 's', v: qty && price ? price : '', s: { fill: fill(bg), font: font(false, C.dark, 9), alignment: align('right', 'center', false), border: bdr() } });
      setCell(6, rowIdx, { t: qty && price ? 'n' : 's', v: qty && price ? qty * price : '', s: { fill: fill(bg), font: font(true, C.dark, 9), alignment: align('right', 'center', false), border: bdr() } });
      setCell(7, rowIdx, {
        t: 's', v: isEquip ? '18% VAT' : 'Exempt',
        s: { fill: fill(isEquip ? C.amber : C.greenLight), font: font(false, isEquip ? C.amberDark : '1B5E20', 7), alignment: align('center', 'center', false), border: bdr() },
      });
      rowIdx++;
    }
  }

  // ── Totals ────────────────────────────────────────────────────────────────
  rowHeights[rowIdx] = 4;
  mc(0, rowIdx, 7, rowIdx, { t: 's', v: '', s: { fill: fill(C.midGray) } });
  rowIdx++;

  const { exemptTotal, standardSubtotal, vat, grandTotal, hasExempt, hasStandard } = calcVATBreakdown(items);

  const addTotRow = (label, value, bgCol, fgCol, bold = false, sz = 9) => {
    rowHeights[rowIdx] = 18;
    mc(0, rowIdx, 5, rowIdx, {
      t: 's', v: label,
      s: { fill: fill(bgCol), font: font(bold, fgCol, sz), alignment: align('right', 'center', false), border: bdr() },
    });
    setCell(6, rowIdx, { t: 'n', v: value, s: { fill: fill(bgCol), font: font(bold, fgCol, sz), alignment: align('right', 'center', false), border: bdr() } });
    setCell(7, rowIdx, { t: 's', v: '', s: { fill: fill(bgCol), border: bdr() } });
    rowIdx++;
  };

  if (hasExempt)   addTotRow('Exempt Supplies — Drugs & Vaccines (VAT Act Cap 349)', exemptTotal, C.greenLight, '1B5E20');
  if (hasStandard) addTotRow('Equipment / Standard-Rated Subtotal', standardSubtotal, C.amber, C.amberDark);
  if (hasStandard) addTotRow('VAT 18% on Equipment', vat, C.redLight, 'B71C1C');

  rowHeights[rowIdx] = 28;
  mc(0, rowIdx, 5, rowIdx, {
    t: 's', v: 'GRAND TOTAL (Uganda Shillings — UGX)',
    s: { fill: fill(C.green), font: font(true, C.white, 12), alignment: align('right', 'center', false), border: bdr() },
  });
  setCell(6, rowIdx, { t: 'n', v: grandTotal, s: { fill: fill(C.green), font: font(true, C.gold, 13), alignment: align('right', 'center', false), border: bdr() } });
  setCell(7, rowIdx, { t: 's', v: '', s: { fill: fill(C.green), border: bdr() } });
  rowIdx++;

  // ── VAT note ─────────────────────────────────────────────────────────────
  if (hasExempt) {
    rowHeights[rowIdx] = 13;
    mc(0, rowIdx, 7, rowIdx, {
      t: 's', v: '  * Veterinary drugs & vaccines are VAT Exempt per Uganda VAT Act (Cap 349), Second Schedule. Equipment items attract 18% VAT. Confirm at ura.go.ug.',
      s: { fill: fill('FAFAF0'), font: font(false, '888800', 7), alignment: align('left', 'center', true) },
    });
    rowIdx++;
  }

  // ── Signature block ───────────────────────────────────────────────────────
  rowHeights[rowIdx] = 8;
  mc(0, rowIdx, 7, rowIdx, { t: 's', v: '', s: {} });
  rowIdx++;

  rowHeights[rowIdx] = 32;
  mc(0, rowIdx, 3, rowIdx, {
    t: 's', v: 'Authorised Signature: _______________________________',
    s: { fill: fill('FAFAFA'), font: font(false, '333333', 9), alignment: align('left', 'bottom', false) },
  });
  mc(4, rowIdx, 7, rowIdx, {
    t: 's', v: 'Name & Title: _______________________________',
    s: { fill: fill('FAFAFA'), font: font(false, '333333', 9), alignment: align('left', 'bottom', false) },
  });
  rowIdx++;

  // ── Footer ────────────────────────────────────────────────────────────────
  rowHeights[rowIdx] = 5;
  mc(0, rowIdx, 7, rowIdx, { t: 's', v: '', s: { fill: fill(C.teal) } });
  rowIdx++;

  rowHeights[rowIdx] = 13;
  mc(0, rowIdx, 7, rowIdx, {
    t: 's', v: `  ${BUYER.name}  ·  ${BUYER.tagline}  ·  ${BUYER.address}  ·  ${BUYER.web}  ·  Generated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`,
    s: { fill: fill('F0F0F0'), font: font(false, '999999', 7), alignment: align('center', 'center', false) },
  });

  // ── Sheet metadata ────────────────────────────────────────────────────────
  ws['!ref'] = `A1:H${maxRow}`;
  ws['!merges'] = merges;
  ws['!cols'] = [
    { wch: 5 },   // #
    { wch: 36 },  // Product
    { wch: 22 },  // Spec
    { wch: 10 },  // Unit
    { wch: 8 },   // Qty
    { wch: 17 },  // Unit Price
    { wch: 18 },  // Amount
    { wch: 10 },  // VAT
  ];
  ws['!rows'] = Array.from({ length: maxRow }, (_, i) => ({ hpt: rowHeights[i + 1] || 14 }));
  ws['!freeze'] = { xSplit: 0, ySplit: 15, topLeftCell: 'A16', activePane: 'bottomLeft' };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Purchase Order');
  XLSX.writeFile(wb, `SmartVet_PO_${orderNo}_${(orderDate || '').replace(/-/g, '')}.xlsx`, { cellStyles: true, bookType: 'xlsx', compression: true });
}


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
      <p>Contact: ${BUYER.contact}</p>
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
