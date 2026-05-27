/**
 * utils/po/excelPO.js
 *
 * Generates and triggers download of a styled Excel (.xlsx) Purchase Order
 * using xlsx-js-style.
 *
 * Exports:
 *   generateExcelPO({ orderNo, orderDate, supplier, supplierDetails, items, paymentTerms })
 *     — Builds a fully formatted worksheet with header, supplier block, line-item table,
 *       VAT-aware totals (Uganda VAT Act Cap 349), and signature block, then saves the file.
 */

import * as XLSX from 'xlsx-js-style';
import { BUYER, getVATStatus, calcVATBreakdown } from './helpers';

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
    [`Contact: ${BUYER.contact}  ·  Tel: ${BUYER.phone}`, 'PAYMENT TERMS:',  paymentTerms],
    [`${BUYER.email}  ·  ${BUYER.web}`,                  'CURRENCY:',       'Uganda Shillings (UGX)'],
    [`${BUYER.pobox}  ·  Gulu City, Uganda`,     'REQUIRED BY:',    'To be confirmed'],
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

  // Track which Excel rows hold exempt vs standard-rated amounts (for SUM formulas)
  const exemptAmtRows    = [];
  const standardAmtRows  = [];

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

      // Amount formula: Qty × Unit Price — live in Excel
      const hasValues = qty > 0 && price > 0;
      const amtFormula = `E${rowIdx}*F${rowIdx}`;

      setCell(0, rowIdx, { t: 'n', v: lineNo++, s: { fill: fill(bg), font: font(false, 'AAAAAA', 8), alignment: align('center', 'center', false), border: bdr() } });
      setCell(1, rowIdx, { t: 's', v: item.name || '', s: { fill: fill(bg), font: font(true, C.dark, 9), alignment: align('left', 'center', true), border: bdr() } });
      setCell(2, rowIdx, { t: 's', v: item.spec || '', s: { fill: fill(bg), font: font(false, '777777', 8), alignment: align('left', 'center', true), border: bdr() } });
      setCell(3, rowIdx, { t: 's', v: item.unit || '', s: { fill: fill(bg), font: font(false, C.dark, 8), alignment: align('center', 'center', false), border: bdr() } });
      setCell(4, rowIdx, { t: 'n', v: qty, s: { fill: fill(C.greenLight), font: font(true, '1B5E20', 11), alignment: align('center', 'center', false), border: bdr() } });
      setCell(5, rowIdx, { t: hasValues ? 'n' : 's', v: hasValues ? price : '', s: { fill: fill(bg), font: font(false, C.dark, 9), alignment: align('right', 'center', false), border: bdr() } });
      setCell(6, rowIdx, { t: 'n', v: hasValues ? qty * price : 0, f: amtFormula, s: { fill: fill(bg), font: font(true, C.dark, 9), alignment: align('right', 'center', false), border: bdr() } });
      setCell(7, rowIdx, {
        t: 's', v: isEquip ? '18% VAT' : 'Exempt',
        s: { fill: fill(isEquip ? C.amber : C.greenLight), font: font(false, isEquip ? C.amberDark : '1B5E20', 7), alignment: align('center', 'center', false), border: bdr() },
      });

      if (hasValues) {
        if (isEquip) standardAmtRows.push(rowIdx);
        else         exemptAmtRows.push(rowIdx);
      }
      rowIdx++;
    }
  }

  // ── Totals ────────────────────────────────────────────────────────────────
  rowHeights[rowIdx] = 4;
  mc(0, rowIdx, 7, rowIdx, { t: 's', v: '', s: { fill: fill(C.midGray) } });
  rowIdx++;

  const { exemptTotal, standardSubtotal, vat, grandTotal, hasExempt, hasStandard } = calcVATBreakdown(items);

  // Build SUM formulas from tracked row numbers
  const sumOf = rows => rows.length ? `SUM(${rows.map(r => `G${r}`).join(',')})` : '0';

  let exemptTotRow = null;
  let standardTotRow = null;
  let vatRow = null;

  const addTotRow = (label, value, formula, bgCol, fgCol, bold = false, sz = 9) => {
    rowHeights[rowIdx] = 18;
    mc(0, rowIdx, 5, rowIdx, {
      t: 's', v: label,
      s: { fill: fill(bgCol), font: font(bold, fgCol, sz), alignment: align('right', 'center', false), border: bdr() },
    });
    setCell(6, rowIdx, { t: 'n', v: value, f: formula, s: { fill: fill(bgCol), font: font(bold, fgCol, sz), alignment: align('right', 'center', false), border: bdr() } });
    setCell(7, rowIdx, { t: 's', v: '', s: { fill: fill(bgCol), border: bdr() } });
    return rowIdx++;
  };

  if (hasExempt)   exemptTotRow   = addTotRow('Exempt Supplies — Drugs & Vaccines (VAT Act Cap 349)', exemptTotal, sumOf(exemptAmtRows), C.greenLight, '1B5E20');
  if (hasStandard) standardTotRow = addTotRow('Equipment / Standard-Rated Subtotal', standardSubtotal, sumOf(standardAmtRows), C.amber, C.amberDark);
  if (hasStandard) vatRow         = addTotRow('VAT 18% on Equipment', vat, `ROUND(G${standardTotRow}*0.18,0)`, C.redLight, 'B71C1C');

  // Grand total formula: sum whichever subtotal rows exist
  const grandParts = [exemptTotRow, standardTotRow, vatRow].filter(Boolean).map(r => `G${r}`);
  const grandFormula = grandParts.length ? grandParts.join('+') : '0';

  rowHeights[rowIdx] = 28;
  mc(0, rowIdx, 5, rowIdx, {
    t: 's', v: 'GRAND TOTAL (Uganda Shillings — UGX)',
    s: { fill: fill(C.green), font: font(true, C.white, 12), alignment: align('right', 'center', false), border: bdr() },
  });
  setCell(6, rowIdx, { t: 'n', v: grandTotal, f: grandFormula, s: { fill: fill(C.green), font: font(true, C.gold, 13), alignment: align('right', 'center', false), border: bdr() } });
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
