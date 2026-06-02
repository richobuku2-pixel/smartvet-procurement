/**
 * NewSalesOrderModal
 *
 * Creates a new outbound sales order (customer → SmartVet delivery).
 * Items are selected from supplier catalogues, enriched with live
 * inventory stock levels and last-logged cost prices.
 */
import { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { MARKUP_TIERS } from '../../constants';

const CUSTOMER_TYPES  = ['clinic', 'farm', 'retailer', 'individual'];
const PAYMENT_METHODS = ['cash', 'mobile_money', 'bank_transfer', 'credit'];
const TIERS           = ['wholesale', 'standard', 'retail'];
const ZONES           = ['Kampala Central', 'Wakiso', 'Mukono', 'Jinja', 'Mbarara', 'Gulu', 'Other'];

const MARKUP = {
  wholesale: MARKUP_TIERS.wholesale.pct,
  standard:  MARKUP_TIERS.standard.pct,
  retail:    MARKUP_TIERS.retail.pct,
};

// ── Inline product search combobox ────────────────────────────────────────────
function ProductPicker({ value, onSelect, catalogueProducts }) {
  const [query, setQuery]   = useState(value || '');
  const [open, setOpen]     = useState(false);
  const wrapRef             = useRef();

  // Sync external value resets
  useEffect(() => { if (!value) setQuery(''); }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return catalogueProducts.slice(0, 40);
    return catalogueProducts
      .filter(p => p.name.toLowerCase().includes(q) || p.supplier.toLowerCase().includes(q) || (p.section || '').toLowerCase().includes(q))
      .slice(0, 40);
  }, [query, catalogueProducts]);

  const handleSelect = (product) => {
    setQuery(product.name);
    setOpen(false);
    onSelect(product);
  };

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search products…"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
          {filtered.map((p, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={() => handleSelect(p)}
              className="w-full text-left px-3 py-2.5 hover:bg-green-50 border-b border-gray-50 last:border-0 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                  <p className="text-[10px] text-gray-400">{p.supplier}{p.section ? ` · ${p.section}` : ''}</p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-1.5">
                  {p.stockQty > 0 ? (
                    <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">
                      {p.stockQty} in stock
                    </span>
                  ) : (
                    <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">no stock</span>
                  )}
                  {p.lastPrice ? (
                    <span className="text-[10px] text-gray-500 font-mono">
                      UGX {p.lastPrice.toLocaleString()}
                    </span>
                  ) : null}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function NewSalesOrderModal({ onClose }) {
  const { addSalesOrder, suppliers, inventory, priceLog, products } = useApp();
  const { currentUser } = useAuth();

  // ── Build catalogue product list enriched with stock + last price ──────────
  const catalogueProducts = useMemo(() => {
    // Latest price per "supplier||catalogueId"
    const latestPrice = {};
    for (const entry of (priceLog || [])) {
      for (const item of (entry.items || [])) {
        const k = `${entry.supplier}||${item.catalogueId}`;
        if (!latestPrice[k] || new Date(entry.date) > new Date(latestPrice[k].date)) {
          latestPrice[k] = { price: item.unitPrice, date: entry.date };
        }
      }
    }

    // Stock qty per product name (loose match)
    const normalize = s => s.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
    const invByName = {};
    for (const p of (products || [])) {
      const qty = (inventory || {})[p.id] || 0;
      if (qty > 0) invByName[normalize(p.name)] = qty;
    }

    const seen = new Set();
    const list = [];
    for (const [supplierName, details] of Object.entries(suppliers || {})) {
      for (const item of (details.catalogue || [])) {
        const key = `${supplierName}||${item.id}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const priceEntry = latestPrice[key];
        // Stock: try exact name match then fuzzy
        const norm   = normalize(item.name);
        const stockQty = invByName[norm] || 0;

        list.push({
          id:         item.id,
          name:       item.name,
          unit:       item.unit || '',
          section:    item.section || '',
          supplier:   supplierName,
          lastPrice:  priceEntry?.price ?? null,
          stockQty,
        });
      }
    }
    return list.sort((a, b) => {
      // In-stock first, then priced, then catalogue-only
      const aScore = a.stockQty > 0 ? 2 : a.lastPrice ? 1 : 0;
      const bScore = b.stockQty > 0 ? 2 : b.lastPrice ? 1 : 0;
      if (bScore !== aScore) return bScore - aScore;
      return a.name.localeCompare(b.name);
    });
  }, [suppliers, inventory, priceLog, products]);

  // ── Form state ────────────────────────────────────────────────────────────
  const [customer, setCustomer] = useState({ name: '', phone: '', location: '', type: 'clinic' });
  const [items, setItems]       = useState([{ productName: '', quantity: 1, unit: 'dose', unitPrice: '', tier: 'standard' }]);
  const [deliveryFee, setDeliveryFee]         = useState(0);
  const [paymentMethod, setPaymentMethod]     = useState('mobile_money');
  const [deliveryZone, setDeliveryZone]       = useState('Kampala Central');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [notes, setNotes]   = useState('');
  const [error, setError]   = useState('');

  const setCust  = (k, v) => setCustomer(p => ({ ...p, [k]: v }));
  const setItem  = (i, k, v) => setItems(p => p.map((it, idx) => idx === i ? { ...it, [k]: v } : it));
  const addItem  = () => setItems(p => [...p, { productName: '', quantity: 1, unit: 'dose', unitPrice: '', tier: 'standard' }]);
  const removeItem = (i) => setItems(p => p.filter((_, idx) => idx !== i));

  // When a catalogue product is selected, auto-fill name, unit, price
  const handleProductSelect = (i, product) => {
    const tier  = items[i].tier || 'standard';
    const cost  = product.lastPrice;
    const price = cost ? Math.round(cost * (1 + MARKUP[tier] / 100)) : '';
    setItems(p => p.map((it, idx) => idx === i ? {
      ...it,
      productName: product.name,
      unit:        product.unit || it.unit,
      unitPrice:   price,
    } : it));
  };

  // Recalculate price when tier changes (if product has a cost)
  const handleTierChange = (i, tier) => {
    setItems(p => p.map((it, idx) => {
      if (idx !== i) return it;
      // Find catalogue product to get cost
      const cat = catalogueProducts.find(c => c.name === it.productName);
      if (cat?.lastPrice) {
        const price = Math.round(cat.lastPrice * (1 + MARKUP[tier] / 100));
        return { ...it, tier, unitPrice: price };
      }
      return { ...it, tier };
    }));
  };

  const subtotal = items.reduce((s, it) => s + (Number(it.unitPrice) || 0) * (Number(it.quantity) || 0), 0);
  const total    = subtotal + Number(deliveryFee || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customer.name.trim())  { setError('Customer name is required.'); return; }
    if (!customer.phone.trim()) { setError('Customer phone is required.'); return; }
    const validItems = items.filter(it => it.productName.trim() && Number(it.quantity) > 0 && Number(it.unitPrice) > 0);
    if (!validItems.length) { setError('Add at least one item with a product, quantity and price.'); return; }
    setError('');
    addSalesOrder({
      customer,
      items: validItems.map(it => ({
        productName: it.productName.trim(),
        quantity:    Number(it.quantity),
        unit:        it.unit,
        unitPrice:   Number(it.unitPrice),
        tier:        it.tier,
        total:       Number(it.quantity) * Number(it.unitPrice),
      })),
      subtotal,
      deliveryFee:    Number(deliveryFee || 0),
      total,
      paymentMethod,
      paymentStatus:  'pending',
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
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-gray-800">Order Items</p>
              <button type="button" onClick={addItem}
                className="text-xs text-green-700 hover:text-green-900 font-semibold border border-green-200 rounded-lg px-2.5 py-1 hover:bg-green-50">
                + Add Item
              </button>
            </div>

            <p className="text-[11px] text-gray-400 mb-3">
              Search from {catalogueProducts.length} catalogue products — price auto-fills from logged cost + markup.
            </p>

            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
                  {/* Row 1: product picker */}
                  <div className="flex gap-2 items-start">
                    <div className="flex-1">
                      <ProductPicker
                        value={item.productName}
                        catalogueProducts={catalogueProducts}
                        onSelect={(p) => handleProductSelect(i, p)}
                      />
                    </div>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)}
                        className="text-gray-300 hover:text-red-400 text-lg leading-none pt-2">✕</button>
                    )}
                  </div>

                  {/* Row 2: qty, unit, price, tier */}
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-400 font-semibold uppercase mb-0.5">Qty</label>
                      <input type="number" min="1" value={item.quantity}
                        onChange={e => setItem(i, 'quantity', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white text-right focus:outline-none focus:ring-2 focus:ring-green-400" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 font-semibold uppercase mb-0.5">Unit</label>
                      <input type="text" value={item.unit}
                        onChange={e => setItem(i, 'unit', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 font-semibold uppercase mb-0.5">UGX Price</label>
                      <input type="number" min="0" value={item.unitPrice}
                        onChange={e => setItem(i, 'unitPrice', e.target.value)}
                        placeholder="0"
                        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white text-right focus:outline-none focus:ring-2 focus:ring-green-400" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 font-semibold uppercase mb-0.5">Tier</label>
                      <select value={item.tier} onChange={e => handleTierChange(i, e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-green-400">
                        {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Line total */}
                  {item.unitPrice && item.quantity && (
                    <p className="text-[11px] text-right text-gray-500">
                      Line total: <span className="font-semibold text-gray-700">
                        UGX {(Number(item.unitPrice) * Number(item.quantity)).toLocaleString()}
                      </span>
                    </p>
                  )}
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
