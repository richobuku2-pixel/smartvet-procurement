/**
 * parseCatalogueFile.js — Smart catalogue import utility
 *
 * Supports three import paths:
 *  1. CSV text  (parseCSV)
 *  2. Excel file (.xlsx / .xls)  (parseExcel)  — uses SheetJS
 *  3. Free-text / pasted PDF content  (extractFromText)
 *
 * All three paths return the same normalised array of catalogue items:
 * {
 *   id:           string   — auto-generated if missing
 *   section:      string
 *   sectionColor: string   — hex without #  (auto-assigned from section)
 *   priority:     '★★★' | '★★' | '★'
 *   name:         string   — required
 *   spec:         string
 *   indication:   string
 *   unit:         string
 *   note:         string
 * }
 */

import * as XLSX from 'xlsx';

// ─── Section colour palette (auto-assigned by section index) ─────────────────
const SECTION_COLOURS = [
  '1F3864', '1B5E20', '4A148C', '4E342E', '006064',
  '37474F', '880E4F', '1A237E', '3E2723', '33691E',
  '0D47A1', '4E342E', '1B4332', '4B2D7F', '2F4F4F',
];

const sectionColourCache = new Map();
let colourIndex = 0;

function getColourForSection(section) {
  const key = (section || '').toLowerCase().trim();
  if (!sectionColourCache.has(key)) {
    sectionColourCache.set(key, SECTION_COLOURS[colourIndex % SECTION_COLOURS.length]);
    colourIndex++;
  }
  return sectionColourCache.get(key);
}

// Reset colour cache (call before each import session)
export function resetColourCache() {
  sectionColourCache.clear();
  colourIndex = 0;
}

// ─── Normalise a raw row into a catalogue item ────────────────────────────────
let _idCounter = 0;

function makeId(prefix = 'IMP') {
  _idCounter++;
  return `${prefix}-${Date.now()}-${_idCounter}`;
}

function normalisePriority(raw) {
  if (!raw) return '★★';
  const s = String(raw).trim();
  if (s.includes('★★★') || s === '3') return '★★★';
  if (s.includes('★★')  || s === '2') return '★★';
  if (s.includes('★')   || s === '1') return '★';
  return '★★';
}

function normaliseRow(row, sectionFallback = '') {
  const section = (row.section || row.category || row.group || row.type || sectionFallback || 'Imported').trim();
  return {
    id:           row.id || makeId(),
    section,
    sectionColor: row.sectionColor || getColourForSection(section),
    priority:     normalisePriority(row.priority || row.Priority),
    name:         (row.name || row.product || row.item || row['product name'] || row['Product Name'] || '').trim(),
    spec:         (row.spec || row.specification || row.Specification || row.description || row.Description || '').trim(),
    indication:   (row.indication || row.use || row.use_case || row['Indication / Use'] || '').trim(),
    unit:         (row.unit || row.uom || row.Unit || '').trim(),
    note:         (row.note || row.notes || row.Note || row.Notes || '').trim(),
  };
}

// ─── 1. Parse CSV text ────────────────────────────────────────────────────────

/**
 * Parse raw CSV string.
 * Returns normalised catalogue items (rows with empty names are skipped).
 */
export function parseCSV(csvText) {
  if (!csvText || !csvText.trim()) return [];

  const lines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  if (lines.length < 2) return [];

  // Parse headers from first non-empty line
  const headerLine = lines[0];
  const headers = parseCsvLine(headerLine).map(h => h.trim().toLowerCase());

  const items = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] || '').trim();
    });

    const item = normaliseRow(row);
    if (item.name) items.push(item);
  }

  return items;
}

/** RFC 4180 CSV line parser — handles quoted fields */
function parseCsvLine(line) {
  const fields = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      fields.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

// ─── 2. Parse Excel file ──────────────────────────────────────────────────────

/**
 * Parse an Excel file (ArrayBuffer from FileReader).
 * Reads the first sheet; returns normalised catalogue items.
 */
export function parseExcel(arrayBuffer) {
  try {
    const wb = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) return { items: [], error: 'Excel file contains no sheets.' };

    const ws = wb.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(ws, { defval: '' });

    // Normalise headers to lowercase
    const normRows = rawRows.map(row => {
      const norm = {};
      for (const [k, v] of Object.entries(row)) {
        norm[k.toLowerCase().trim()] = String(v ?? '').trim();
      }
      return norm;
    });

    const items = normRows
      .map(row => normaliseRow(row))
      .filter(i => i.name);

    return { items, sheetName, rowCount: rawRows.length };
  } catch (err) {
    return { items: [], error: `Excel parse failed: ${err.message}` };
  }
}

// ─── 3. Smart column mapping ──────────────────────────────────────────────────

/** Well-known synonyms for each canonical field */
const COLUMN_SYNONYMS = {
  name:       ['name', 'product', 'product name', 'item', 'item name', 'drug', 'medicine', 'description'],
  section:    ['section', 'category', 'group', 'type', 'class', 'therapeutic area', 'area'],
  spec:       ['spec', 'specification', 'formulation', 'strength', 'dosage form', 'form'],
  indication: ['indication', 'use', 'indication / use', 'therapeutic use', 'for', 'treats'],
  unit:       ['unit', 'uom', 'pack unit', 'unit of measure', 'packaging'],
  priority:   ['priority', 'rank', 'tier', 'importance'],
  note:       ['note', 'notes', 'remarks', 'remark', 'comment', 'instructions'],
};

/**
 * Given a list of raw column headers, return a mapping:
 * { canonicalField: rawHeaderName | null }
 * Uses fuzzy matching on synonyms.
 */
export function smartMapColumns(rawHeaders) {
  const lower = rawHeaders.map(h => h.toLowerCase().trim());
  const mapping = {};

  for (const [field, synonyms] of Object.entries(COLUMN_SYNONYMS)) {
    // Exact match first
    let found = lower.find(h => synonyms.includes(h));
    // Partial match fallback
    if (!found) {
      found = lower.find(h => synonyms.some(s => h.includes(s) || s.includes(h)));
    }
    mapping[field] = found
      ? rawHeaders[lower.indexOf(found)]
      : null;
  }

  return mapping;
}

// ─── 4. Extract from pasted text (PDF / email content) ───────────────────────

/**
 * Extract product names and basic details from free-form pasted text.
 * Uses heuristic line-by-line analysis.
 *
 * Returns an array of normalised catalogue items.
 * These will typically have name populated; other fields are best-effort.
 */
export function extractFromText(rawText) {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split(/\n|\r\n/).map(l => l.trim()).filter(Boolean);
  const items  = [];
  let currentSection = 'Imported';

  // Patterns that suggest a section header (all-caps, short, or prefixed with section markers)
  const sectionPatterns = [
    /^[A-Z][A-Z\s&\/]{5,50}$/,           // ALL CAPS line
    /^[0-9]+[\.\)]\s+[A-Z][A-Z\s]+/,     // "1. ANTIBIOTICS"
    /^(section|category|group)[:—\s]/i,   // "Section: Antibiotics"
    /^[-=*]{3,}/,                          // separator lines
  ];

  // Patterns that suggest a product line
  const productPatterns = [
    /^[A-Z][a-zA-Z\s\-/®™()]{3,60}\s*[—\-|]/,  // "ProductName — spec"
    /^\d+\.\s+[A-Z]/,                              // "1. Product Name"
    /^[•\-*]\s+[A-Z]/,                             // bullet point
    /\b(injection|oral|tablet|drench|solution|powder|suspension|spray)\b/i, // contains dosage form
  ];

  for (const line of lines) {
    // Skip obviously non-product lines
    if (line.length < 4 || line.length > 200) continue;
    if (/^\d+$/.test(line)) continue;
    if (/^(page|total|subtotal|price|cost|date|ref)/i.test(line)) continue;

    // Check if this line looks like a section header
    const isSection = sectionPatterns.some(p => p.test(line));
    if (isSection && line.length < 80) {
      currentSection = cleanSectionName(line);
      continue;
    }

    // Check if it looks like a product
    const isProduct = productPatterns.some(p => p.test(line));
    if (!isProduct && !looksLikeProductName(line)) continue;

    // Parse the line
    const parsed = parseProductLine(line);
    if (parsed.name && parsed.name.length >= 3) {
      items.push(normaliseRow({ ...parsed, section: currentSection }));
    }
  }

  return items;
}

function cleanSectionName(line) {
  return line
    .replace(/^[0-9]+[\.\)]\s+/, '')
    .replace(/^[-=*•]+\s*/, '')
    .replace(/[:—\-]\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function looksLikeProductName(line) {
  // Has a capital letter start and reasonable word count
  const words = line.split(/\s+/);
  if (words.length < 2 || words.length > 15) return false;
  if (!/^[A-Z]/.test(line)) return false;
  // Not a pure sentence (likely a heading or product, not prose)
  const lowerWords = words.filter(w => w.length > 3 && w[0] === w[0].toLowerCase());
  return lowerWords.length < words.length * 0.6;
}

function parseProductLine(line) {
  // Split on common delimiters: — - | :
  const parts = line.split(/\s*[—|\-]\s*/);

  const name = parts[0]
    .replace(/^\d+[\.\)]\s+/, '')
    .replace(/^[•\-*]\s+/, '')
    .trim();

  const spec = parts.length > 1
    ? parts.slice(1).join(' — ').trim()
    : '';

  // Try to extract a unit hint
  const unitMatch = spec.match(/\b(bottles?|vials?|tabs?|tablets?|sachets?|kg|boxes?|units?|packs?|litres?|liters?|ml|g\b)\b/i);
  const unit = unitMatch ? unitMatch[0].toLowerCase() : '';

  return { name, spec, unit };
}
