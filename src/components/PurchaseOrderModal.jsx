/**
 * PurchaseOrderModal — 3-step procurement wizard
 *
 * Step 1: Select Supplier
 * Step 2: Quote Sheet  (record qty + unit price per product during supplier call)
 * Step 3: Download PO  (preview, Excel & PDF download, optional order record save)
 *
 * Props
 *   isOpen       — boolean
 *   onClose      — () => void
 *   prefillOrder — optional existing order object to skip to Step 3 for re-download
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { generateExcelPO, generatePDFPO, generateOrderNo, calcVATBreakdown } from '../utils/generatePODocument';

const PAYMENT_TERMS = ['Net 30', 'Net 15', 'Net 60', 'Cash on Delivery', 'Prepayment'];

// ─── Priority badge ────────────────────────────────────────────────────────────
function PriorityBadge({ priority }) {
  if (priority === '★★★') return <span className="text-red-500 font-bold text-xs">★★★</span>;
  if (priority === '★★')  return <span className="text-amber-500 font-bold text-xs">★★</span>;
  return <span className="text-gray-300 text-xs">★</span>;
}

// ─── Step indicator ────────────────────────────────────────────────────────────
function StepIndicator({ step }) {
  const steps = [
    { n: 1, label: 'Select Supplier' },
    { n: 2, label: 'Quote Sheet' },
    { n: 3, label: 'Download PO' },
  ];
  return (
    <div className="flex items-center gap-0 mb-5">
      {steps.map((s, idx) => (
        <div key={s.n} className="flex items-center">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            step === s.n
              ? 'bg-red-900 text-white shadow'
              : step > s.n
              ? 'bg-green-700 text-white'
              : 'bg-gray-100 text-gray-400'
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
              step === s.n ? 'bg-white/20' : step > s.n ? 'bg-white/20' : 'bg-gray-200'
            }`}>
              {step > s.n ? '✓' : s.n}
            </span>
            <span className="hidden sm:inline">{s.label}</span>
          </div>
          {idx < steps.length - 1 && (
            <div className={`w-6 h-0.5 mx-1 ${step > s.n ? 'bg-green-600' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// STEP 1 — Supplier Selection
// ═══════════════════════════════════════════════════════════════════════════════
function Step1SupplierSelect({ suppliers, onSelect }) {
  const [contactEdits, setContactEdits] = useState({});

  const list = Object.entries(suppliers || {});

  const getContact = (name, details) =>
    contactEdits[name] !== undefined ? contactEdits[name] : (details.contactPerson || '');

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-gray-900">Select Supplier</h3>
        <p className="text-sm text-gray-500 mt-0.5">Choose the supplier you're calling. Edit the contact person for this PO.</p>
      </div>

      {list.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">
          No suppliers found. Add suppliers from the Suppliers page first.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[55vh] overflow-y-auto pr-1">
        {list.map(([name, details]) => {
          const catCount = (details.catalogue || []).length;
          return (
            <div key={name}
              className="border border-gray-200 rounded-xl p-4 hover:border-red-300 hover:shadow-md transition-all cursor-pointer group bg-white"
            >
              {/* Supplier name + catalogue count */}
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-900 to-red-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {name.charAt(0)}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  catCount > 0 ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'
                }`}>
                  {catCount > 0 ? `${catCount} products` : 'No catalogue'}
                </span>
              </div>

              <p className="font-semibold text-gray-900 text-sm leading-tight mb-1">{name}</p>
              <p className="text-xs text-gray-400 mb-3">{details.contactEmail || '—'}</p>

              {/* Contact person — editable for this PO */}
              <div className="mb-3">
                <label className="block text-xs text-gray-400 mb-1">Contact person (this call)</label>
                <input
                  type="text"
                  value={getContact(name, details)}
                  onChange={e => setContactEdits(p => ({ ...p, [name]: e.target.value }))}
                  onClick={e => e.stopPropagation()}
                  placeholder={details.contactPerson || 'Enter name…'}
                  className="w-full text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
                />
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3 text-xs text-gray-500">
                {details.phone && <span>📞 {details.phone}</span>}
                {details.paymentTerms && <span>⏱ {details.paymentTerms}</span>}
              </div>

              <button
                onClick={() => onSelect(name, details, getContact(name, details))}
                className="w-full py-2 bg-red-900 hover:bg-red-800 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Select Supplier →
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2 — Quote Sheet
// ═══════════════════════════════════════════════════════════════════════════════
function Step2QuoteSheet({ supplierName, supplierDetails, contactPerson, catalogue, quotes, onQuoteChange, onBack, onNext }) {
  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState('all');

  const sections = useMemo(() => [...new Set(catalogue.map(i => i.section))], [catalogue]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return catalogue.filter(item => {
      const matchSection = sectionFilter === 'all' || item.section === sectionFilter;
      const matchSearch = !q
        || item.name.toLowerCase().includes(q)
        || (item.spec || '').toLowerCase().includes(q)
        || (item.indication || '').toLowerCase().includes(q);
      return matchSection && matchSearch;
    });
  }, [catalogue, search, sectionFilter]);

  // Group filtered items by section
  const grouped = useMemo(() => {
    const map = new Map();
    for (const item of filtered) {
      if (!map.has(item.section)) map.set(item.section, []);
      map.get(item.section).push(item);
    }
    return [...map.entries()];
  }, [filtered]);

  // Running totals
  const { lineCount, runningTotal } = useMemo(() => {
    let count = 0; let total = 0;
    for (const [id, q] of Object.entries(quotes)) {
      const qty = Number(q.qty) || 0;
      const price = Number(q.unitPrice) || 0;
      if (qty > 0) { count++; total += qty * price; }
    }
    return { lineCount: count, runningTotal: total };
  }, [quotes]);

  const handleQty = (id, val) => {
    const num = val === '' ? '' : Number(val);
    onQuoteChange(id, 'qty', num);
  };

  const handlePrice = (id, val) => {
    const num = val === '' ? '' : Number(val);
    onQuoteChange(id, 'unitPrice', num);
  };

  if (!catalogue.length) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
          <h3 className="text-base font-bold text-gray-900">Quote Sheet — {supplierName}</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-4xl mb-3">📂</p>
          <p className="font-medium text-gray-700">No catalogue yet for {supplierName}</p>
          <p className="text-sm text-gray-400 mt-2 max-w-sm">
            Add products to this supplier's catalogue from the <strong>Suppliers</strong> page,
            then come back here to create a purchase order.
          </p>
          <button onClick={onBack} className="mt-5 px-5 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            ← Choose Different Supplier
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0" style={{ maxHeight: '80vh' }}>
      {/* Header */}
      <div className="flex-shrink-0 space-y-3 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-700 font-medium">← Back</button>
            <div>
              <h3 className="text-base font-bold text-gray-900">{supplierName}</h3>
              {contactPerson && <p className="text-xs text-gray-400">Speaking with: <strong>{contactPerson}</strong></p>}
            </div>
          </div>
          {/* Running total */}
          <div className="text-right">
            <p className="text-xs text-gray-400">{lineCount} item{lineCount !== 1 ? 's' : ''} quoted</p>
            <p className="text-sm font-bold text-gray-900">UGX {runningTotal.toLocaleString()}</p>
          </div>
        </div>

        {/* Search + filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products…"
              className="w-full pl-7 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
          <select
            value={sectionFilter}
            onChange={e => setSectionFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-400 max-w-[180px]"
          >
            <option value="all">All Sections</option>
            {sections.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Column headers */}
      <div className="flex-shrink-0 grid grid-cols-[1fr_60px_110px_110px_90px] gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-semibold text-gray-500 uppercase tracking-wide">
        <span>Product</span>
        <span className="text-center">Unit</span>
        <span className="text-center">Qty</span>
        <span className="text-center">Unit Price (UGX)</span>
        <span className="text-right">Line Total</span>
      </div>

      {/* Scrollable items */}
      <div className="flex-1 overflow-y-auto space-y-0 min-h-0" style={{ maxHeight: 'calc(80vh - 260px)' }}>
        {grouped.length === 0 && (
          <div className="py-10 text-center text-sm text-gray-400">No products match your search.</div>
        )}

        {grouped.map(([section, items]) => {
          const hex = items[0]?.sectionColor || '2D5A2D';
          return (
            <div key={section}>
              {/* Section header */}
              <div
                className="px-3 py-2 text-white text-xs font-bold uppercase tracking-wider mt-2 rounded-lg"
                style={{ backgroundColor: `#${hex}` }}
              >
                {section}
              </div>

              {/* Product rows */}
              {items.map(item => {
                const q = quotes[item.id] || {};
                const qty   = Number(q.qty) || 0;
                const price = Number(q.unitPrice) || 0;
                const lineTotal = qty * price;
                const hasQty = qty > 0;

                return (
                  <div
                    key={item.id}
                    className={`grid grid-cols-[1fr_60px_110px_110px_90px] gap-1.5 items-center px-3 py-2 border-b border-gray-50 text-xs transition-colors ${
                      hasQty ? 'bg-green-50/60' : 'hover:bg-gray-50/50'
                    }`}
                  >
                    {/* Product info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <PriorityBadge priority={item.priority} />
                        <span className={`font-medium truncate ${hasQty ? 'text-green-900' : 'text-gray-800'}`}>
                          {item.name}
                        </span>
                      </div>
                      {item.spec && (
                        <p className="text-gray-400 text-xs mt-0.5 truncate">{item.spec}</p>
                      )}
                    </div>

                    {/* Unit */}
                    <span className="text-center text-gray-500">{item.unit || '—'}</span>

                    {/* Qty input */}
                    <input
                      type="number"
                      min="0"
                      value={q.qty ?? ''}
                      onChange={e => handleQty(item.id, e.target.value)}
                      placeholder="0"
                      className={`w-full text-center border rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-500 ${
                        hasQty ? 'border-green-300 bg-green-50 font-semibold text-green-800' : 'border-gray-200 bg-yellow-50'
                      }`}
                    />

                    {/* Price input */}
                    <input
                      type="number"
                      min="0"
                      value={q.unitPrice ?? ''}
                      onChange={e => handlePrice(item.id, e.target.value)}
                      placeholder="0"
                      className={`w-full text-center border rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-red-400 ${
                        hasQty && price > 0 ? 'border-red-200 bg-red-50 font-semibold' : 'border-gray-200 bg-red-50/30'
                      }`}
                    />

                    {/* Line total */}
                    <span className={`text-right font-mono ${hasQty && price > 0 ? 'text-gray-900 font-semibold' : 'text-gray-300'}`}>
                      {hasQty && price > 0 ? lineTotal.toLocaleString() : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer CTA */}
      <div className="flex-shrink-0 pt-3 border-t border-gray-100 flex items-center justify-between mt-3">
        <div className="text-sm text-gray-500">
          {lineCount > 0
            ? <span className="text-green-700 font-semibold">{lineCount} item{lineCount !== 1 ? 's' : ''} · UGX {runningTotal.toLocaleString()} subtotal</span>
            : <span className="text-gray-400">Enter quantities and prices as you speak to the supplier.</span>
          }
        </div>
        <button
          onClick={onNext}
          disabled={lineCount === 0}
          className="px-5 py-2.5 bg-red-900 text-white rounded-lg text-sm font-semibold hover:bg-red-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Generate PO ({lineCount} items) →
        </button>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// STEP 3 — Download PO
// ═══════════════════════════════════════════════════════════════════════════════
function Step3Download({ supplierName, supplierDetails, finalItems, orders, onBack, onClose, notify, saveOrderRecord }) {
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


// ═══════════════════════════════════════════════════════════════════════════════
// MAIN MODAL
// ═══════════════════════════════════════════════════════════════════════════════
export default function PurchaseOrderModal({ isOpen, onClose, prefillOrder = null }) {
  const { suppliers, orders, notify, saveOrderRecord } = useApp();

  const [step, setStep] = useState(1);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedDetails, setSelectedDetails]   = useState(null);
  const [contactPerson, setContactPerson]       = useState('');
  // quotes: { [catalogueItemId]: { qty: number|'', unitPrice: number|'' } }
  const [quotes, setQuotes] = useState({});

  // ── Initialize / reset when modal opens ──────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    if (prefillOrder) {
      // Open directly at Step 3 with existing order data
      setSelectedSupplier(prefillOrder.supplier);
      setSelectedDetails(suppliers[prefillOrder.supplier] || {});
      setContactPerson(suppliers[prefillOrder.supplier]?.contactPerson || '');
      setStep(3);
      // quotes not needed — finalItems computed from prefillOrder below
      setQuotes({});
    } else {
      setStep(1);
      setSelectedSupplier(null);
      setSelectedDetails(null);
      setContactPerson('');
      setQuotes({});
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Quote change handler ──────────────────────────────────────────────────
  const handleQuoteChange = useCallback((itemId, field, value) => {
    setQuotes(prev => ({
      ...prev,
      [itemId]: { ...(prev[itemId] || {}), [field]: value },
    }));
  }, []);

  // ── Computed final items (Step 3) ─────────────────────────────────────────
  const finalItems = useMemo(() => {
    if (prefillOrder) {
      return prefillOrder.items.map((item, i) => ({
        id: `prefill-${i}`,
        name: item.productName,
        unit: item.unit || '',
        section: 'Ordered Items',
        sectionColor: '2D5A2D',
        qty: item.quantity,
        unitPrice: item.unitCost,
      }));
    }
    if (!selectedSupplier) return [];
    const catalogue = suppliers[selectedSupplier]?.catalogue || [];
    return catalogue
      .filter(item => Number(quotes[item.id]?.qty) > 0)
      .map(item => ({
        ...item,
        qty: Number(quotes[item.id]?.qty) || 0,
        unitPrice: Number(quotes[item.id]?.unitPrice) || 0,
      }));
  }, [prefillOrder, selectedSupplier, quotes, suppliers]);

  if (!isOpen) return null;

  const catalogue = selectedSupplier ? (suppliers[selectedSupplier]?.catalogue || []) : [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* ── Modal Header ── */}
        <div className="bg-gradient-to-r from-red-900 to-red-800 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📄</span>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">Purchase Order Wizard</h2>
              <p className="text-red-200 text-xs mt-0.5">
                {step === 1 && 'Select a supplier to begin'}
                {step === 2 && `Quote sheet — ${selectedSupplier}`}
                {step === 3 && `Ready to download`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-red-200 hover:text-white text-2xl leading-none transition-colors"
          >
            &times;
          </button>
        </div>

        {/* ── Step indicator ── */}
        <div className="px-6 pt-4 flex-shrink-0">
          <StepIndicator step={step} />
        </div>

        {/* ── Step content ── */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-0">
          {step === 1 && (
            <Step1SupplierSelect
              suppliers={suppliers}
              onSelect={(name, details, contact) => {
                setSelectedSupplier(name);
                setSelectedDetails(details);
                setContactPerson(contact);
                setStep(2);
              }}
            />
          )}

          {step === 2 && selectedSupplier && (
            <Step2QuoteSheet
              supplierName={selectedSupplier}
              supplierDetails={selectedDetails}
              contactPerson={contactPerson}
              catalogue={catalogue}
              quotes={quotes}
              onQuoteChange={handleQuoteChange}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}

          {step === 3 && (
            <Step3Download
              supplierName={selectedSupplier || prefillOrder?.supplier}
              supplierDetails={selectedDetails || suppliers[prefillOrder?.supplier] || {}}
              finalItems={finalItems}
              orders={orders}
              onBack={prefillOrder ? null : () => setStep(2)}
              onClose={onClose}
              notify={notify}
              saveOrderRecord={saveOrderRecord}
            />
          )}
        </div>
      </div>
    </div>
  );
}
