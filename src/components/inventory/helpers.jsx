/**
 * inventory/helpers.jsx
 *
 * Small shared UI primitives and utility functions used across the
 * Inventory page components.
 *
 * Exports:
 *   PriorityBadge   — renders ★/★★/★★★ coloured stars for a catalogue item priority
 *   StockBar        — visual percentage bar showing current stock level
 *   VARIANCE_CLS    — returns a Tailwind class string for stock-count variance display
 *   matchProduct    — fuzzy-matches a POS product name to an inventory product
 *   parsePasteData  — parses CSV/TSV/colon-separated paste text into [{name, qty}]
 *   downloadTemplate — triggers a CSV download of the blank stock-count template
 */

/**
 * PriorityBadge
 * @param {{ p: '★' | '★★' | '★★★' }} props
 */
export function PriorityBadge({ p }) {
  if (p === '★★★') return <span className="text-red-500 font-bold text-[10px] leading-none">★★★</span>;
  if (p === '★★')  return <span className="text-amber-500 font-bold text-[10px] leading-none">★★</span>;
  return <span className="text-gray-300 text-[10px] leading-none">★</span>;
}

/** Status config map — shared by StockBar and SupplierSection */
export const STATUS = {
  ok:       { label: 'OK',       dot: 'bg-green-500',  badge: 'bg-green-100 text-green-700',  row: '',              input: 'border-gray-200 bg-white text-gray-900 focus:ring-green-400' },
  low:      { label: 'Low',      dot: 'bg-amber-400',  badge: 'bg-amber-100 text-amber-700',  row: 'bg-amber-50/40', input: 'border-amber-300 bg-amber-50 text-amber-800 focus:ring-amber-400' },
  critical: { label: 'Critical', dot: 'bg-red-500',    badge: 'bg-red-100 text-red-700',      row: 'bg-red-50/50',  input: 'border-red-300 bg-red-50 text-red-800 focus:ring-red-400' },
};

/**
 * StockBar
 * @param {{ current: number, reorderPoint: number, minStock: number }} props
 */
export function StockBar({ current, reorderPoint, minStock }) {
  const max = Math.max(reorderPoint * 2, current + 5, 1);
  const pct = Math.min(100, Math.round((current / max) * 100));
  const st  = current <= minStock ? 'critical' : current <= reorderPoint ? 'low' : 'ok';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden min-w-[60px]">
        <div className={`h-full rounded-full ${STATUS[st].dot}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-gray-400 font-mono w-7 text-right">{pct}%</span>
    </div>
  );
}

/**
 * Returns a Tailwind className string for variance display in stock count tables.
 * @param {number} v - variance value (positive, negative, or zero)
 * @returns {string}
 */
export const VARIANCE_CLS = (v) =>
  v > 0 ? 'text-green-600 font-semibold' : v < 0 ? 'text-red-600 font-semibold' : 'text-gray-400';

/**
 * Fuzzy-match a POS product name to an inventory product.
 * @param {string} posName
 * @param {Array<{id: any, name: string}>} products
 * @returns {object|null}
 */
export function matchProduct(posName, products) {
  const needle = posName.toLowerCase().trim();
  let match = products.find(p => p.name.toLowerCase() === needle);
  if (match) return match;
  match = products.find(p => p.name.toLowerCase().includes(needle));
  if (match) return match;
  return products.find(p => needle.includes(p.name.toLowerCase())) || null;
}

/**
 * Parse paste text (CSV / TSV / colon separated) into [{name, qty}] rows.
 * Skips header rows and rows without valid quantity values.
 * @param {string} raw
 * @returns {Array<{name: string, qty: number}>}
 */
export function parsePasteData(raw) {
  const rows = [];
  for (const line of raw.split('\n').map(l => l.trim()).filter(Boolean)) {
    if (/^(product|name|item)/i.test(line)) continue;
    const delimIdx = Math.max(line.lastIndexOf(','), line.lastIndexOf(':'), line.lastIndexOf('\t'));
    if (delimIdx > 0) {
      const name = line.slice(0, delimIdx).trim().replace(/^["']|["']$/g, '');
      const qty  = parseInt(line.slice(delimIdx + 1).trim(), 10);
      if (name && !isNaN(qty) && qty >= 0) rows.push({ name, qty });
    }
  }
  return rows;
}

/**
 * Trigger a browser CSV download of the blank stock-count template.
 * @param {Array<{name: string}>} products
 */
export function downloadTemplate(products) {
  const blob = new Blob(['Product Name,Current Stock\n' + products.map(p => `"${p.name}",0`).join('\n')], { type: 'text/csv' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'smartvet_stock_template.csv' });
  a.click();
  URL.revokeObjectURL(a.href);
}
