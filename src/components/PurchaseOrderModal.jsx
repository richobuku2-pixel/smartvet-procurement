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
import Step1SupplierSelect from './purchase-order/Step1SupplierSelect';
import Step2QuoteSheet from './purchase-order/Step2QuoteSheet';
import Step3Download from './purchase-order/Step3Download';

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
