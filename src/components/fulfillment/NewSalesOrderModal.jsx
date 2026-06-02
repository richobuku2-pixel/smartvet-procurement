/**
 * NewSalesOrderModal
 *
 * Creates a new outbound sales order (customer → SmartVet delivery).
 * Captures: customer details, line items, payment method, delivery zone.
 */
import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

const CUSTOMER_TYPES = ['clinic', 'farm', 'retailer', 'individual'];
const PAYMENT_METHODS = ['cash', 'mobile_money', 'bank_transfer', 'credit'];
const TIERS = ['wholesale', 'standard', 'retail'];
const ZONES = ['Kampala Central', 'Wakiso', 'Mukono', 'Jinja', 'Mbarara', 'Gulu', 'Other'];

const EMPTY_ITEM = { productName: '', quantity: 1, unit: 'dose', unitPrice: '', tier: 'standard' };

export default function NewSalesOrderModal({ onClose }) {
  const { addSalesOrder, products, inventory } = useApp();
  const { currentUser } = useAuth();

  const [customer, setCustomer] = useState({ name: '', phone: '', location: '', type: 'clinic' });
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('mobile_money');
  const [deliveryZone, setDeliveryZone] = useState('Kampala Central');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const setCust = (k, v) => setCustomer(p => ({ ...p, [k]: v }));
  const setItem = (i, k, v) => setItems(p => p.map((it, idx) => idx === i ? { ...it, [k]: v } : it));
  const addItem = () => setItems(p => [...p, { ...EMPTY_ITEM }]);
  const removeItem = (i) => setItems(p => p.filter((_, idx) => idx !== i));

  const subtotal = items.reduce((s, it) => s + (Number(it.unitPrice) || 0) * (Number(it.quantity) || 0), 0);
  const total = subtotal + Number(deliveryFee || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customer.name.trim()) { setError('Customer name is required.'); return; }
    if (!customer.phone.trim()) { setError('Customer phone is required.'); return; }
    const validItems = items.filter(it => it.productName.trim() && Number(it.quantity) > 0 && Number(it.unitPrice) > 0);
    if (!validItems.length) { setError('Add at least one item with a name, quantity and price.'); return; }
    setError('');

    addSalesOrder({
      customer,
      items: validItems.map(it => ({
        productName: it.productName.trim(),
        quantity: Number(it.quantity),
        unit: it.unit,
        unitPrice: Number(it.unitPrice),
        tier: it.tier,
        total: Number(it.quantity) * Number(it.unitPrice),
      })),
      subtotal,
      deliveryFee: Number(deliveryFee || 0),
      total,
      paymentMethod,
      paymentStatus: 'pending',
      deliveryZone,
      deliveryAddress,
      expectedDelivery,
      notes,
      createdBy: currentUser?.name || currentUser?.email || 'System',
    });
    onClose();
  };

  const fieldCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent';
  const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-bold text-gray-900">New Sales Order</h2>
            <p className="text-xs text-gray-400 mt-0.5">Outbound delivery to customer</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg flex items-center gap-2">
              <span>⚠️</span><span>{error}</span>
            </div>
          )}

          {/* Customer */}
          <div>
            <p className="text-sm font-bold text-gray-800 mb-3">Customer Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className={labelCls}>Name *</label>
                <input type="text" value={customer.name} onChange={e => setCust('name', e.target.value)}
                  placeholder="e.g. Nakato Vet Clinic" className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Phone *</label>
                <input type="tel" value={customer.phone} onChange={e => setCust('phone', e.target.value)}
                  placeholder="+256 700 000000" className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Type</label>
                <select value={customer.type} onChange={e => setCust('type', e.target.value)} className={fieldCls}>
                  {CUSTOMER_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Location</label>
                <input type="text" value={customer.location} onChange={e => setCust('location', e.target.value)}
                  placeholder="e.g. Ntinda, Kampala" className={fieldCls} />
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-gray-800">Order Items</p>
              <button type="button" onClick={addItem}
                className="text-xs text-green-700 hover:text-green-900 font-semibold border border-green-200 rounded-lg px-2.5 py-1 hover:bg-green-50">
                + Add Item
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-start bg-gray-50 rounded-xl p-3">
                  {/* Product name */}
                  <div className="col-span-12 sm:col-span-4">
                    <input type="text" value={item.productName} onChange={e => setItem(i, 'productName', e.target.value)}
                      placeholder="Product name" className={`${fieldCls} bg-white`} />
                  </div>
                  {/* Qty */}
                  <div className="col-span-3 sm:col-span-2">
                    <input type="number" min="1" value={item.quantity} onChange={e => setItem(i, 'quantity', e.target.value)}
                      placeholder="Qty" className={`${fieldCls} bg-white text-right`} />
                  </div>
                  {/* Unit */}
                  <div className="col-span-3 sm:col-span-2">
                    <input type="text" value={item.unit} onChange={e => setItem(i, 'unit', e.target.value)}
                      placeholder="Unit" className={`${fieldCls} bg-white`} />
                  </div>
                  {/* Unit price */}
                  <div className="col-span-4 sm:col-span-2">
                    <input type="number" min="0" value={item.unitPrice} onChange={e => setItem(i, 'unitPrice', e.target.value)}
                      placeholder="UGX price" className={`${fieldCls} bg-white text-right`} />
                  </div>
                  {/* Tier */}
                  <div className="col-span-9 sm:col-span-1">
                    <select value={item.tier} onChange={e => setItem(i, 'tier', e.target.value)} className={`${fieldCls} bg-white text-xs`}>
                      {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  {/* Remove */}
                  <div className="col-span-3 sm:col-span-1 flex items-center justify-end">
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)}
                        className="text-gray-300 hover:text-red-400 text-lg leading-none">✕</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Totals */}
            <div className="mt-3 flex justify-end">
              <div className="text-xs text-gray-500 space-y-1 text-right">
                <div>Subtotal: <span className="font-semibold text-gray-700">UGX {subtotal.toLocaleString()}</span></div>
                <div className="flex items-center gap-2 justify-end">
                  <span>Delivery fee:</span>
                  <input type="number" min="0" value={deliveryFee} onChange={e => setDeliveryFee(e.target.value)}
                    className="w-24 text-xs border border-gray-200 rounded px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-green-400" />
                </div>
                <div className="text-sm font-bold text-gray-900 border-t border-gray-200 pt-1">
                  Total: UGX {total.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Delivery + Payment */}
          <div>
            <p className="text-sm font-bold text-gray-800 mb-3">Delivery & Payment</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Delivery Zone</label>
                <select value={deliveryZone} onChange={e => setDeliveryZone(e.target.value)} className={fieldCls}>
                  {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Payment Method</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className={fieldCls}>
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Delivery Address</label>
                <input type="text" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)}
                  placeholder="Street / landmark" className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Expected Delivery</label>
                <input type="date" value={expectedDelivery} onChange={e => setExpectedDelivery(e.target.value)}
                  min={new Date().toISOString().split('T')[0]} className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Notes</label>
                <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Any instructions…" className={fieldCls} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="submit"
              className="flex-1 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-bold transition-colors">
              Create Sales Order
            </button>
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
