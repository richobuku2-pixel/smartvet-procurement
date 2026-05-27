/**
 * utils/po/helpers.js
 *
 * Shared constants and pure utility functions used by both excelPO.js and pdfPO.js.
 *
 * Exports:
 *   BUYER            — SmartVet Africa buyer details object
 *   fmt(n)           — Locale-format a number for display (en-UG)
 *   getSupplierCode  — Derive a 2-letter supplier code from a supplier name
 *   generateOrderNo  — Auto-generate a PO number (e.g. "SV-GV-001")
 *   getVATStatus     — Classify a catalogue item as 'exempt' or 'standard' per Uganda VAT Act
 *   calcVATBreakdown — Compute full VAT breakdown (exempt, standard, vat, grandTotal) for a list of items
 */

export const BUYER = {
  name:    'SmartVet Africa',
  tagline: 'Animal Health meets Innovation',
  address: 'Dispatch Warehouse, Plot 75, Jomo Kenyatta Road, Elephante Commons, Gulu City',
  pobox:   'P. O. Box 361968, Gulu',
  contact: 'Richard Obuku',
  phone:   '+256 393 194 736',
  email:   'hello@smartvet.africa',
  web:     'smartvetafrica.com',
};

const VAT_RATE = 0.18;

// Keywords that indicate equipment/supplies (standard-rated at 18% VAT)
const EQUIPMENT_KEYWORDS = [
  'equipment', 'supplies', 'syringe', 'applicator', 'ear tag', 'eartag',
  'drencher', 'drench gun', 'instrument', 'needle', 'clip', 'injector',
  'bolus gun', 'tag', 'tagger', 'hardware', 'consumable',
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

/** Locale-format a number for display (en-UG). Returns '0' for non-numeric input. */
export function fmt(n) {
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
