/**
 * inventory/SupplierSection.jsx
 *
 * Collapsible table card showing all inventory products for a single supplier.
 * Supports inline stock editing, sort by name/stock/status, and per-row
 * edit/delete actions for authorised users.
 *
 * Props:
 *   supplier        {string}   — supplier name (used as card heading)
 *   supplierDetails {Object}   — supplier details (contactEmail, minimumOrderQuantity, leadTimeDays)
 *   products        {Array}    — products belonging to this supplier
 *   localInventory  {Object}   — {productId: qty} map (may include unsaved edits)
 *   onChange        {Function} — called with (productId, value) when a stock input changes
 *   errors          {Object}   — {productId: boolean} map of invalid inputs
 *   editMode        {boolean}  — whether stock cells are editable
 *   sortField       {string}   — active sort field ('name' | 'stock' | 'status' | '')
 *   sortDir         {number}   — 1 for ascending, -1 for descending
 *   onEdit          {Function} — called with product object when edit is clicked
 *   onDelete        {Function} — called with product object when delete is clicked
 *   canManage       {boolean}  — whether the user has edit/delete permissions
 */

import { useState } from 'react';
import { getStockStatus } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatter';
import { StockBar, STATUS } from './helpers';

export default function SupplierSection({ supplier, supplierDetails, products, localInventory, onChange, errors, editMode, sortField, sortDir, onEdit, onDelete, canManage }) {
  const [collapsed, setCollapsed] = useState(false);

  const sorted = [...products].sort((a, b) => {
    if (!sortField) return 0;
    if (sortField === 'name')   return sortDir * a.name.localeCompare(b.name);
    if (sortField === 'stock')  return sortDir * ((localInventory[a.id] ?? 0) - (localInventory[b.id] ?? 0));
    if (sortField === 'status') {
      const order = { critical: 0, low: 1, ok: 2 };
      return sortDir * (order[getStockStatus(a, localInventory[a.id] ?? 0)] - order[getStockStatus(b, localInventory[b.id] ?? 0)]);
    }
    return 0;
  });

  const totalValue = products.reduce((s, p) => {
    const q = isNaN(Number(localInventory[p.id])) ? 0 : Number(localInventory[p.id]);
    return s + q * p.landedCost;
  }, 0);
  const alertCount = products.filter(p => getStockStatus(p, localInventory[p.id] ?? 0) !== 'ok').length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

      {/* ── Supplier header ──────────────────────────────────────────── */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-green-800 to-teal-700 text-white hover:from-green-900 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-mono text-xs opacity-70">{collapsed ? '▶' : '▼'}</span>
          <div className="text-left min-w-0">
            <p className="font-bold text-sm">{supplier}</p>
            <p className="text-green-200 text-xs truncate">
              {supplierDetails?.contactEmail || '—'}
              {supplierDetails?.minimumOrderQuantity ? ` · MOQ: ${supplierDetails.minimumOrderQuantity}` : ''}
              {supplierDetails?.leadTimeDays ? ` · Lead: ${supplierDetails.leadTimeDays}d` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {alertCount > 0 && (
            <span className="bg-red-500/80 text-white text-xs px-2.5 py-0.5 rounded-full font-semibold">
              {alertCount} alert{alertCount !== 1 ? 's' : ''}
            </span>
          )}
          <div className="text-right">
            <p className="text-[10px] text-green-200 uppercase tracking-wide">Stock value</p>
            <p className="font-mono font-bold text-sm">{formatCurrency(totalValue)}</p>
          </div>
        </div>
      </button>

      {/* ── Product table ─────────────────────────────────────────────── */}
      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-100 bg-gray-50/80">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Product</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide w-24">Status</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide w-36">
                  Current Stock {editMode && <span className="normal-case text-teal-500 font-normal">(editing)</span>}
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide w-40">Level</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide w-28">Thresholds</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide w-28">Unit Cost</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide w-28">Stock Value</th>
                {canManage && <th className="px-3 py-2.5 w-20" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map(product => {
                const rawStock   = localInventory[product.id] ?? '';
                const stock      = rawStock === '' ? 0 : Number(rawStock);
                const status     = getStockStatus(product, stock);
                const cfg        = STATUS[status];
                const hasError   = !!errors[product.id];
                const stockValue = (isNaN(stock) ? 0 : stock) * product.landedCost;

                return (
                  <tr key={product.id} className={`group transition-colors hover:bg-gray-50/60 ${cfg.row}`}>

                    {/* Product */}
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800 leading-snug">{product.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {product.unit}
                        {product.section && <span className="ml-1.5 text-gray-300">· {product.section}</span>}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} flex-shrink-0`} />
                        {cfg.label}
                      </span>
                    </td>

                    {/* Stock cell — editable in edit mode, read-only otherwise */}
                    <td className="px-3 py-3 text-center">
                      {editMode ? (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={rawStock}
                            onChange={e => onChange(product.id, e.target.value)}
                            className={`w-20 text-center border-2 rounded-lg px-2 py-1.5 text-base font-bold font-mono focus:outline-none focus:ring-2 transition-colors ${
                              hasError ? 'border-red-400 bg-red-50 text-red-700 focus:ring-red-400' : cfg.input
                            }`}
                          />
                          <span className="text-[10px] text-gray-400 leading-tight max-w-[30px]">{product.unit}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <span className={`text-xl font-bold font-mono ${
                            status === 'critical' ? 'text-red-600' : status === 'low' ? 'text-amber-600' : 'text-gray-800'
                          }`}>{stock}</span>
                          <span className="text-[10px] text-gray-400">{product.unit}</span>
                        </div>
                      )}
                      {hasError && <p className="text-[10px] text-red-500 mt-1">Invalid value</p>}
                    </td>

                    {/* Level bar */}
                    <td className="px-3 py-3">
                      <StockBar current={isNaN(stock) ? 0 : stock} reorderPoint={product.reorderPoint} minStock={product.minStock} />
                    </td>

                    {/* Thresholds */}
                    <td className="px-3 py-3 text-center">
                      <div className="space-y-0.5">
                        <p className="text-xs text-gray-500">
                          <span className="text-amber-600 font-semibold">Reorder:</span> {product.reorderPoint}
                        </p>
                        <p className="text-xs text-gray-500">
                          <span className="text-red-500 font-semibold">Min:</span> {product.minStock}
                        </p>
                      </div>
                    </td>

                    {/* Unit cost */}
                    <td className="px-3 py-3 text-right">
                      <p className="font-mono text-sm text-gray-700">{formatCurrency(product.landedCost)}</p>
                      <p className="text-[10px] text-gray-400">per {(product.unit || 'unit').toLowerCase()}</p>
                    </td>

                    {/* Stock value */}
                    <td className="px-3 py-3 text-right">
                      <p className="font-mono text-sm font-semibold text-gray-800">{formatCurrency(stockValue)}</p>
                    </td>

                    {/* Actions */}
                    {canManage && (
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => onEdit(product)}
                            className="p-1.5 rounded-md text-teal-600 hover:bg-teal-50 transition-colors" title="Edit product">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6.768-6.768a2 2 0 112.828 2.828L11.828 13.83a4 4 0 01-1.414.93l-3.414 1.138 1.138-3.414a4 4 0 01.93-1.414z" />
                            </svg>
                          </button>
                          <button onClick={() => onDelete(product)}
                            className="p-1.5 rounded-md text-red-400 hover:bg-red-50 transition-colors" title="Remove product">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>

            {/* Section subtotal */}
            <tfoot>
              <tr className="border-t-2 border-gray-100 bg-gray-50/60">
                <td colSpan={canManage ? 6 : 5} className="px-4 py-2.5 text-xs text-gray-400 font-medium">
                  {products.length} product{products.length !== 1 ? 's' : ''} · {supplier}
                </td>
                <td className="px-3 py-2.5 text-right font-mono font-bold text-gray-700 text-sm">
                  {formatCurrency(totalValue)}
                </td>
                {canManage && <td />}
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
