import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/formatter';
import { calculateSupplierBalance } from '../utils/calculations';

function PaymentForm({ supplierName, onSubmit, onCancel }) {
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], amount: '', reference: '', chequeNo: '', notes: '' });
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) { setError('Enter a valid amount'); return; }
    if (!form.date) { setError('Enter a payment date'); return; }
    onSubmit({ ...form, amount, approvedBy: 'accounts_manager', recordedAt: new Date().toISOString() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Payment Date *</label>
          <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
            max={new Date().toISOString().split('T')[0]}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" required />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Amount (UGX) *</label>
          <input type="number" min="1" placeholder="425000" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500" required />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Reference No.</label>
          <input type="text" placeholder="CHQ-5678 or transfer ref" value={form.reference} onChange={e => setForm(p => ({ ...p, reference: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Cheque No.</label>
          <input type="text" placeholder="Optional" value={form.chequeNo} onChange={e => setForm(p => ({ ...p, chequeNo: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
        <input type="text" placeholder="Optional notes" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
      </div>
      <div className="flex gap-3">
        <button type="submit" className="flex-1 py-2.5 bg-teal-700 text-white rounded-lg text-sm font-semibold hover:bg-teal-800">Record Payment</button>
        <button type="button" onClick={onCancel} className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

function SupplierDetail({ name, account, orders, suppliers, onRecordPayment, hasPermission }) {
  const [tab, setTab] = useState('credits');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const balance = calculateSupplierBalance(account);
  const sup = suppliers[name] || {};

  const supplierOrders = orders.filter(o => o.supplier === name && o.status === 'sent');

  return (
    <div className="space-y-4">
      {/* Account summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-gray-50 rounded-lg p-3 text-sm">
          <p className="text-xs text-gray-500">Outstanding Balance</p>
          <p className={`font-mono font-bold mt-1 ${balance > 1000000 ? 'text-red-600' : balance > 500000 ? 'text-amber-600' : 'text-green-600'}`}>{formatCurrency(balance)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-sm">
          <p className="text-xs text-gray-500">Total Ordered</p>
          <p className="font-mono font-bold mt-1 text-gray-800">{formatCurrency((account?.credits || []).reduce((s, c) => s + c.amount, 0))}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-sm">
          <p className="text-xs text-gray-500">Total Paid</p>
          <p className="font-mono font-bold mt-1 text-gray-800">{formatCurrency((account?.payments || []).reduce((s, p) => s + p.amount, 0))}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-sm">
          <p className="text-xs text-gray-500">Payment Terms</p>
          <p className="font-semibold mt-1 text-gray-800">{account?.paymentTerms || sup.paymentTerms || 'Net 30'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {['credits', 'payments'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'credits' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {(!account?.credits || account.credits.length === 0) ? (
            <div className="p-8 text-center text-gray-400 text-sm">No order credits yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Order ID</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[...account.credits].reverse().map((credit, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-600">{formatDate(credit.date)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{credit.orderId}</td>
                    <td className="px-4 py-3 text-gray-600">{credit.description}</td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-red-600">{formatCurrency(credit.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'payments' && (
        <div className="space-y-4">
          {hasPermission && !showPaymentForm && (
            <button onClick={() => setShowPaymentForm(true)} className="px-4 py-2 bg-teal-700 text-white rounded-lg text-sm font-medium hover:bg-teal-800">
              + Record Payment
            </button>
          )}

          {showPaymentForm && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
              <h4 className="font-semibold text-gray-800 mb-4">Record Payment to {name}</h4>
              <PaymentForm
                supplierName={name}
                onSubmit={(payment) => { onRecordPayment(name, payment); setShowPaymentForm(false); }}
                onCancel={() => setShowPaymentForm(false)}
              />
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {(!account?.payments || account.payments.length === 0) ? (
              <div className="p-8 text-center text-gray-400 text-sm">No payments recorded yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Reference</th>
                    <th className="px-4 py-3 text-left">Notes</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[...account.payments].reverse().map((payment, i) => (
                    <tr key={i} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-gray-600">{formatDate(payment.date)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{payment.reference || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{payment.notes || '—'}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-green-600">{formatCurrency(payment.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SupplierAccounts() {
  const { orders, suppliers, supplierAccounts, recordPayment, hasPermission } = useApp();
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const supplierNames = [...new Set([...Object.keys(suppliers), ...Object.keys(supplierAccounts)])];

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Supplier Accounts</h2>
        <p className="text-sm text-gray-500">Track outstanding balances, record payments, and view transaction history.</p>
      </div>

      {/* Supplier cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {supplierNames.map(name => {
          const account = supplierAccounts[name];
          const sup = suppliers[name] || {};
          const balance = calculateSupplierBalance(account);
          const isSelected = selectedSupplier === name;

          return (
            <div
              key={name}
              className={`bg-white rounded-xl border shadow-sm cursor-pointer transition-all ${isSelected ? 'border-teal-400 ring-2 ring-teal-100' : 'border-gray-100 hover:border-gray-300'}`}
              onClick={() => setSelectedSupplier(isSelected ? null : name)}
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{sup.contactEmail} · {sup.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-mono font-bold text-lg ${balance > 1000000 ? 'text-red-600' : balance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                      {formatCurrency(balance)}
                    </p>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{account?.paymentTerms || sup.paymentTerms || 'Net 30'}</span>
                  </div>
                </div>
                <div className="flex gap-4 mt-3 text-xs text-gray-500">
                  <span>{(account?.credits || []).length} orders</span>
                  <span>{(account?.payments || []).length} payments</span>
                  <span>MOQ: {sup.minimumOrderQuantity || '—'}</span>
                </div>
              </div>

              {isSelected && (
                <div className="border-t border-gray-100 p-5" onClick={e => e.stopPropagation()}>
                  <SupplierDetail
                    name={name}
                    account={account || { credits: [], payments: [], balance: 0 }}
                    orders={orders}
                    suppliers={suppliers}
                    onRecordPayment={recordPayment}
                    hasPermission={hasPermission('record_payments')}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {supplierNames.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
          No supplier accounts yet. Send an order to a supplier to create an account.
        </div>
      )}
    </div>
  );
}
