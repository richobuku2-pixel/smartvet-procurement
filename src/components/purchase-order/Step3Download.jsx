/**
 * purchase-order/Step3Download.jsx
 *
 * Step 3 of the Purchase Order Wizard — PO preview and download.
 * Shows VAT-aware totals, a preview table of line items, and buttons
 * to download as Excel or PDF, or save the order record to the system.
 *
 * Props:
 *   supplierName    {string}   — supplier name
 *   supplierDetails {Object}   — supplier details object
 *   finalItems      {Array}    — line items array: { id, name, section, unit, qty, unitPrice, ... }
 *   orders          {Array}    — existing orders (for PO number auto-generation)
 *   onBack          {Function|null} — navigates back to Step 2, or null when editing an existing order
 *   onClose         {Function} — closes the whole modal
 *   notify          {Function} — AppContext notify helper
 *   saveOrderRecord {Function} — AppContext saveOrderRecord helper
 */

import { useState, useMemo } from 'react';
import { generateExcelPO, generatePDFPO, generateOrderNo, calcVATBreakdown } from '../../utils/po';

const PAYMENT_TERMS = ['Net 30', 'Net 15', 'Net 60', 'Cash on Delivery', 'Prepayment'];

export default function Step3Download({ supplierName, supplierDetails, finalItems, orders, onBack, onClose, notify, saveOrderRecord }) {
  const today = new Date().toISOString().split('T')[0];
  const [orderNo, setOrderNo]       = useState(() => generateOrderNo(supplierName, orders));
  const [orderDate, setOrderDate]   = useState(today);
  const [paymentTerms, setPaymentTerms] = useState(supplierDetails?.paymentTerms || 'Net 30');
  const [saved, setSaved]           = useState(false);
  const [downloading, setDownloading] = useState(false);

  const vatBreakdown = useMemo(() => calcVATBreakdown(finalItems), [finalItems]);

  const doExcel = () => {
    setDownloading(true);
    try {
      generateExcelPO({ orderNo, orderDate, supplier: supplierName, supplierDetails, items: finalItems, paymentTerms });
    } catch (e) {
      notify('Excel generation failed: ' + e.message, 'error');
    }
    setDownloading(false);
  };

  const doPDF = () => {
    try {
      generatePDFPO({ orderNo, orderDate, supplier: supplierName, supplierDetails, items: finalItems, paymentTerms });
    } catch (e) {
      notify('PDF generation failed: ' + e.message, 'error');
    }
  };

  const doSave = () => {
    if (saved) return;
    const record = {
      orderId: orderNo,
      supplier: supplierName,
      items: finalItems.map(i => ({
        productName: i.name,
        ...(i.productId != null ? { productId: i.productId } : {}),
        quantity: Number(i.qty),
        unit: i.unit || '',
        unitCost: Number(i.unitPrice),
        lineCost: (Number(i.qty) || 0) * (Number(i.unitPrice) || 0),
      })),
      totalCost: vatBreakdown.grandTotal,
      status: 'ready_to_send',
    };
    saveOrderRecord(record);
    setSaved(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {onBack && <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-700 font-medium">← Back</button>}
        <h3 className="text-base font-bold text-gray-900">Purchase Order — {supplierName}</h3>
      </div>

      {/* Order meta fields */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-gray-500 font-semibold uppercase mb-1">PO Number</label>
          <input
            value={orderNo}
            onChange={e => setOrderNo(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 font-semibold uppercase mb-1">Order Date</label>
          <input
            type="date"
            value={orderDate}
            onChange={e => setOrderDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 font-semibold uppercase mb-1">Payment Terms</label>
          <select
            value={paymentTerms}
            onChange={e => setPaymentTerms(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            {PAYMENT_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Summary stats — Uganda VAT aware */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex-1 min-w-[80px] rounded-lg px-3 py-3 bg-gray-50 border border-gray-100">
          <p className="text-xs font-semibold uppercase text-gray-400">Items</p>
          <p className="text-sm font-bold mt-0.5 text-gray-900">{finalItems.length}</p>
        </div>
        {vatBreakdown.hasExempt && (
          <div className="flex-1 min-w-[100px] rounded-lg px-3 py-3 bg-green-50 border border-green-200">
            <p className="text-xs font-semibold uppercase text-green-600">Drugs/Vaccines</p>
            <p className="text-sm font-bold mt-0.5 text-green-900">UGX {vatBreakdown.exemptTotal.toLocaleString()}</p>
            <p className="text-[10px] text-green-500 mt-0.5">VAT Exempt</p>
          </div>
        )}
        {vatBreakdown.hasStandard && (
          <div className="flex-1 min-w-[100px] rounded-lg px-3 py-3 bg-amber-50 border border-amber-200">
            <p className="text-xs font-semibold uppercase text-amber-600">Equipment</p>
            <p className="text-sm font-bold mt-0.5 text-amber-900">UGX {vatBreakdown.standardSubtotal.toLocaleString()}</p>
            <p className="text-[10px] text-amber-500 mt-0.5">VAT 18% = UGX {vatBreakdown.vat.toLocaleString()}</p>
          </div>
        )}
        {!vatBreakdown.hasExempt && !vatBreakdown.hasStandard && (
          <div className="flex-1 min-w-[100px] rounded-lg px-3 py-3 bg-gray-50 border border-gray-100">
            <p className="text-xs font-semibold uppercase text-gray-400">Subtotal</p>
            <p className="text-sm font-bold mt-0.5 text-gray-900">UGX 0</p>
          </div>
        )}
        <div className="flex-1 min-w-[110px] rounded-lg px-3 py-3 bg-red-900 text-white">
          <p className="text-xs font-semibold uppercase text-red-200">Grand Total</p>
          <p className="text-sm font-bold mt-0.5 text-white">UGX {vatBreakdown.grandTotal.toLocaleString()}</p>
        </div>
      </div>

      {/* Preview table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Order Preview — {finalItems.length} item{finalItems.length !== 1 ? 's' : ''}
        </div>
        <div className="max-h-52 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 sticky top-0">
              <tr className="text-gray-400 uppercase text-[10px]">
                <th className="px-4 py-2 text-left">Product</th>
                <th className="px-3 py-2 text-left">Section</th>
                <th className="px-3 py-2 text-center">Unit</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2 text-right">Unit Price</th>
                <th className="px-3 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {finalItems.map((item, i) => (
                <tr key={item.id || i} className="hover:bg-gray-50/50">
                  <td className="px-4 py-2 font-medium text-gray-800 max-w-[200px] truncate">{item.name}</td>
                  <td className="px-3 py-2 text-gray-400 max-w-[120px] truncate">{item.section || '—'}</td>
                  <td className="px-3 py-2 text-center text-gray-500">{item.unit || '—'}</td>
                  <td className="px-3 py-2 text-right font-mono">{(item.qty || 0).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right font-mono">{(item.unitPrice || 0).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right font-mono font-semibold">
                    {((Number(item.qty) || 0) * (Number(item.unitPrice) || 0)).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Download buttons */}
      <div className="flex gap-3 pt-1">
        <button
          onClick={doExcel}
          disabled={downloading}
          className="flex-1 py-3 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span>📊</span> Download Excel
        </button>
        <button
          onClick={doPDF}
          className="flex-1 py-3 bg-red-900 hover:bg-red-800 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <span>🖨️</span> Download PDF
        </button>
        <button
          onClick={doSave}
          disabled={saved}
          className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
            saved
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'border-2 border-teal-600 text-teal-700 hover:bg-teal-50'
          }`}
        >
          <span>{saved ? '✓' : '💾'}</span>
          {saved ? 'Saved to System' : 'Save Order Record'}
        </button>
      </div>
    </div>
  );
}
