import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatDateTime } from '../utils/formatter';
import { TRANSFER_STATUSES } from '../data/seedData';

// ── Helpers ───────────────────────────────────────────────────────────────────
const LOCATION_TYPES = ['store', 'clinic', 'depot', 'warehouse'];

function typeBadge(type) {
  const map = {
    warehouse: 'bg-blue-100 text-blue-700 border border-blue-200',
    store:     'bg-emerald-100 text-emerald-700 border border-emerald-200',
    clinic:    'bg-purple-100 text-purple-700 border border-purple-200',
    depot:     'bg-amber-100 text-amber-700 border border-amber-200',
  };
  return map[type] || 'bg-gray-100 text-gray-600 border border-gray-200';
}

function statusBadge(color) {
  const map = {
    warning:   'bg-amber-50 text-amber-700 border border-amber-200',
    success:   'bg-green-50 text-green-700 border border-green-200',
    secondary: 'bg-gray-100 text-gray-600 border border-gray-200',
    primary:   'bg-blue-50 text-blue-700 border border-blue-200',
    danger:    'bg-red-50 text-red-700 border border-red-200',
    info:      'bg-teal-50 text-teal-700 border border-teal-200',
  };
  return map[color] || 'bg-gray-100 text-gray-600';
}

// ── Add / Edit Location Modal ─────────────────────────────────────────────────
function LocationModal({ initial = null, onClose, onSave }) {
  const [form, setForm] = useState({
    name:          initial?.name          || '',
    type:          initial?.type          || 'store',
    address:       initial?.address       || '',
    contactPerson: initial?.contactPerson || '',
    contactPhone:  initial?.contactPhone  || '',
    contactEmail:  initial?.contactEmail  || '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave(form);
  };

  const Field = ({ label, fieldKey, type = 'text', required = false }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={form[fieldKey]}
        onChange={e => setForm(f => ({ ...f, [fieldKey]: e.target.value }))}
        className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 ${
          errors[fieldKey] ? 'border-red-400' : 'border-gray-300'
        }`}
      />
      {errors[fieldKey] && <p className="text-xs text-red-500 mt-0.5">{errors[fieldKey]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">{initial ? 'Edit Location' : 'Add Location'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="p-6 space-y-4">
          <Field label="Location Name" fieldKey="name" required />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              {LOCATION_TYPES.map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>
          <Field label="Address" fieldKey="address" />
          <Field label="Contact Person" fieldKey="contactPerson" />
          <Field label="Contact Phone" fieldKey="contactPhone" type="tel" />
          <Field label="Contact Email" fieldKey="contactEmail" type="email" />
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            {initial ? 'Save Changes' : 'Add Location'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── New Transfer Order Modal ───────────────────────────────────────────────────
function NewTransferModal({ locations, products, inventory, onClose, onCreate }) {
  const darkStores = locations.filter(l => !l.isMain && l.active !== false);
  const [toLocationId, setToLocationId] = useState(darkStores[0]?.id || '');
  const [items, setItems]   = useState([{ productId: '', qty: 1 }]);
  const [notes, setNotes]   = useState('');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!toLocationId) e.location = 'Select a destination';
    const validItems = items.filter(i => i.productId && Number(i.qty) > 0);
    if (!validItems.length) e.items = 'Add at least one item';
    items.forEach((it, idx) => {
      if (it.productId) {
        const avail = inventory[it.productId] || 0;
        if (Number(it.qty) > avail) e[`qty_${idx}`] = `Only ${avail} available`;
        if (Number(it.qty) < 1)    e[`qty_${idx}`] = 'Qty must be at least 1';
      }
    });
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const toLoc = locations.find(l => l.id === toLocationId);
    const transferItems = items
      .filter(i => i.productId && Number(i.qty) > 0)
      .map(i => {
        const prod = products.find(p => p.id === Number(i.productId));
        return {
          productId:   Number(i.productId),
          productName: prod?.name || '',
          quantity:    Number(i.qty),
          unit:        prod?.unit || '',
        };
      });
    onCreate({ toLocationId, toLocationName: toLoc?.name, fromLocationId: 'loc_main', items: transferItems, notes });
    onClose();
  };

  const addRow    = () => setItems(prev => [...prev, { productId: '', qty: 1 }]);
  const removeRow = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));
  const updateRow = (idx, key, val) =>
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [key]: val } : it));

  const usedIds = items.map(i => i.productId).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-semibold text-gray-900">New Transfer Order</h2>
            <p className="text-xs text-gray-500 mt-0.5">Send stock from Main Warehouse to a store</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Destination */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Destination <span className="text-red-500">*</span>
            </label>
            {darkStores.length === 0 ? (
              <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                No locations available. Add a store or depot first.
              </p>
            ) : (
              <select
                value={toLocationId}
                onChange={e => setToLocationId(e.target.value)}
                className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 ${
                  errors.location ? 'border-red-400' : 'border-gray-300'
                }`}
              >
                <option value="">Select location…</option>
                {darkStores.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            )}
            {errors.location && <p className="text-xs text-red-500 mt-0.5">{errors.location}</p>}
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600">
                Items <span className="text-red-500">*</span>
              </label>
              <button
                onClick={addRow}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium"
              >
                + Add row
              </button>
            </div>

            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 border-b border-gray-200">
                    <th className="px-3 py-2 text-left font-medium">Product</th>
                    <th className="px-3 py-2 text-right font-medium w-28">Available</th>
                    <th className="px-3 py-2 text-right font-medium w-24">Qty</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((it, idx) => {
                    const avail = it.productId ? (inventory[Number(it.productId)] ?? 0) : null;
                    const overQty = avail !== null && Number(it.qty) > avail;
                    return (
                      <tr key={idx} className={overQty ? 'bg-red-50' : ''}>
                        <td className="px-3 py-2">
                          <select
                            value={it.productId}
                            onChange={e => updateRow(idx, 'productId', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                          >
                            <option value="">Select product…</option>
                            {products.map(p => (
                              <option
                                key={p.id}
                                value={p.id}
                                disabled={usedIds.includes(String(p.id)) && it.productId !== String(p.id)}
                              >
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 text-right">
                          {avail !== null ? (
                            <span className={`text-xs font-medium ${avail === 0 ? 'text-red-500' : 'text-gray-500'}`}>
                              {avail}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            min={1}
                            max={avail || undefined}
                            value={it.qty}
                            onChange={e => updateRow(idx, 'qty', e.target.value)}
                            className={`w-20 border rounded px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-teal-400 ${
                              errors[`qty_${idx}`] ? 'border-red-400' : 'border-gray-300'
                            }`}
                          />
                          {errors[`qty_${idx}`] && (
                            <p className="text-xs text-red-500 mt-0.5 whitespace-nowrap">{errors[`qty_${idx}`]}</p>
                          )}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {items.length > 1 && (
                            <button
                              onClick={() => removeRow(idx)}
                              className="text-gray-300 hover:text-red-500 text-lg leading-none"
                            >
                              ×
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {errors.items && <p className="text-xs text-red-500 mt-1">{errors.items}</p>}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              placeholder="Optional dispatch notes…"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={darkStores.length === 0}
            className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Transfer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Receive Transfer Modal ────────────────────────────────────────────────────
function ReceiveTransferModal({ transfer, onClose, onConfirm }) {
  const initQtys = Object.fromEntries(
    (transfer.items || []).map(i => [i.productId, i.quantity])
  );
  const [qtys, setQtys] = useState(initQtys);
  const [notes, setNotes] = useState('');

  const hasDisc = (transfer.items || []).some(
    i => Number(qtys[i.productId]) !== i.quantity
  );

  const handleConfirm = () => {
    const receivedItems = (transfer.items || []).map(i => ({
      productId:   i.productId,
      productName: i.productName,
      receivedQty: Number(qtys[i.productId] ?? 0),
    }));
    onConfirm(receivedItems, notes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Confirm Receipt — {transfer.orderId}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Recording arrival at <strong>{transfer.toLocationName}</strong>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-4">
          {/* Items table */}
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 border-b border-gray-200">
                  <th className="px-3 py-2 text-left font-medium">Product</th>
                  <th className="px-3 py-2 text-right font-medium">Ordered</th>
                  <th className="px-3 py-2 text-right font-medium">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(transfer.items || []).map(item => {
                  const rec  = Number(qtys[item.productId] ?? 0);
                  const disc = rec !== item.quantity;
                  return (
                    <tr key={item.productId} className={disc ? 'bg-amber-50' : ''}>
                      <td className="px-3 py-2 text-gray-700">{item.productName}</td>
                      <td className="px-3 py-2 text-right text-gray-500">{item.quantity}</td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          min={0}
                          value={qtys[item.productId] ?? item.quantity}
                          onChange={e =>
                            setQtys(prev => ({ ...prev, [item.productId]: e.target.value }))
                          }
                          className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-teal-400"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {hasDisc && (
            <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
              <span>⚠️</span>
              <span>
                Quantity discrepancies detected. Stock will be updated with received quantities only.
                Main warehouse will be debited by the received amounts.
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              placeholder="Condition notes, discrepancy reasons…"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            ✓ Confirm Receipt
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Location Card ─────────────────────────────────────────────────────────────
function LocationCard({ location, transferOrders, stockData, isAdmin, onEdit, onDelete }) {
  const skuCount  = Object.keys(stockData).filter(k => (stockData[k] || 0) > 0).length;
  const totalItems = Object.values(stockData).reduce((s, v) => s + (v || 0), 0);

  const recentTransfer = location.isMain
    ? null
    : [...transferOrders]
        .filter(t => t.toLocationId === location.id && t.status === 'received')
        .sort((a, b) => new Date(b.receivedAt || b.updatedAt) - new Date(a.receivedAt || a.updatedAt))[0];

  const pendingCount = location.isMain
    ? 0
    : transferOrders.filter(
        t => t.toLocationId === location.id && !['received', 'rejected'].includes(t.status)
      ).length;

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col ${
        location.isMain
          ? 'border-teal-200 ring-1 ring-teal-100'
          : 'border-gray-200'
      }`}
    >
      {/* Card header */}
      <div
        className={`px-4 py-3 flex items-start justify-between gap-2 ${
          location.isMain ? 'bg-gradient-to-r from-teal-50 to-green-50' : 'bg-gray-50'
        }`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 text-sm truncate">{location.name}</h3>
            {location.isMain && (
              <span className="text-xs bg-teal-600 text-white px-1.5 py-0.5 rounded font-medium">Main</span>
            )}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium capitalize ${typeBadge(location.type)}`}>
              {location.type}
            </span>
            {location.active === false && (
              <span className="text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">Inactive</span>
            )}
          </div>
          {location.address && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{location.address}</p>
          )}
        </div>
        {isAdmin && !location.isMain && (
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={() => onEdit(location)}
              className="text-gray-400 hover:text-blue-600 text-sm leading-none p-1"
              title="Edit"
            >
              ✏️
            </button>
            <button
              onClick={() => onDelete(location)}
              className="text-gray-400 hover:text-red-500 text-sm leading-none p-1"
              title="Remove"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="px-4 py-3 flex gap-3 text-center">
        <div className="flex-1">
          <p className="text-2xl font-bold text-gray-800">{totalItems.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Total Units</p>
        </div>
        <div className="w-px bg-gray-100" />
        <div className="flex-1">
          <p className="text-2xl font-bold text-gray-800">{skuCount}</p>
          <p className="text-xs text-gray-500">SKUs Stocked</p>
        </div>
        {pendingCount > 0 && (
          <>
            <div className="w-px bg-gray-100" />
            <div className="flex-1">
              <p className="text-2xl font-bold text-amber-500">{pendingCount}</p>
              <p className="text-xs text-gray-500">In Transit</p>
            </div>
          </>
        )}
      </div>

      {/* Contact / last restock */}
      <div className="px-4 py-2 border-t border-gray-100 space-y-0.5 mt-auto">
        {location.contactPerson && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span>👤</span>
            <span className="truncate">{location.contactPerson}</span>
          </div>
        )}
        {location.contactPhone && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span>📞</span>
            <span>{location.contactPhone}</span>
          </div>
        )}
        {!location.isMain && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
            <span>🕒</span>
            <span>
              {recentTransfer
                ? `Last restocked: ${formatDate(recentTransfer.receivedAt || recentTransfer.updatedAt)}`
                : 'No restocks yet'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Network() {
  const {
    locations, transferOrders, locationInventory, inventory, products,
    addLocation, updateLocation, deleteLocation,
    createTransferOrder, updateTransferStatus, receiveTransfer, deleteTransferOrder,
  } = useApp();
  const { currentUser } = useAuth();

  const role       = currentUser?.role;
  const isAdmin    = role === 'admin';
  const canApprove = isAdmin || role === 'procurement_manager';
  const canManage  = isAdmin || role === 'inventory_manager';

  // Modal state
  const [showAddLoc,      setShowAddLoc]      = useState(false);
  const [editingLoc,      setEditingLoc]      = useState(null);
  const [showNewTransfer, setShowNewTransfer] = useState(false);
  const [receivingTO,     setReceivingTO]     = useState(null);

  // Filters
  const [filterStatus, setFilterStatus]   = useState('');
  const [filterLocId,  setFilterLocId]    = useState('');

  // ── Location handlers
  const handleAddLoc    = (data) => { addLocation(data); setShowAddLoc(false); };
  const handleEditLoc   = (data) => { updateLocation(editingLoc.id, data); setEditingLoc(null); };
  const handleDeleteLoc = (loc) => {
    if (window.confirm(`Remove "${loc.name}"? Location inventory will be cleared.`)) {
      deleteLocation(loc.id);
    }
  };

  // ── Transfer handlers
  const handleApprove   = (t) => updateTransferStatus(t.id, 'approved',   { approvedAt:  new Date().toISOString(), approvedBy: currentUser?.name || role });
  const handleReject    = (t) => { if (window.confirm(`Reject ${t.orderId}?`)) updateTransferStatus(t.id, 'rejected',  { rejectedAt:  new Date().toISOString() }); };
  const handlePicking   = (t) => updateTransferStatus(t.id, 'picking',    { pickingAt:   new Date().toISOString() });
  const handleDispatch  = (t) => updateTransferStatus(t.id, 'dispatched', { dispatchedAt: new Date().toISOString() });
  const handleReceive   = (receivedItems) => {
    receiveTransfer(receivingTO.id, receivedItems);
    setReceivingTO(null);
  };

  const filteredTransfers = [...transferOrders]
    .filter(t => !filterStatus || t.status === filterStatus)
    .filter(t => !filterLocId  || t.toLocationId === filterLocId)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  const darkStores = locations.filter(l => !l.isMain);

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Store Network</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage locations and send stock from the main warehouse to dark stores
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {(canApprove || canManage) && (
            <button
              onClick={() => setShowNewTransfer(true)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 shadow-sm"
            >
              📦 New Transfer
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setShowAddLoc(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm"
            >
              + Add Location
            </button>
          )}
        </div>
      </div>

      {/* ── Location cards ────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Locations ({locations.length})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {locations.map(loc => (
            <LocationCard
              key={loc.id}
              location={loc}
              transferOrders={transferOrders}
              stockData={loc.isMain ? inventory : (locationInventory[loc.id] || {})}
              isAdmin={isAdmin}
              onEdit={setEditingLoc}
              onDelete={handleDeleteLoc}
            />
          ))}
          {/* Add location placeholder card */}
          {isAdmin && (
            <button
              onClick={() => setShowAddLoc(true)}
              className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-teal-300 hover:text-teal-500 transition-colors min-h-[200px]"
            >
              <span className="text-4xl leading-none">+</span>
              <span className="text-sm font-medium">Add Location</span>
            </button>
          )}
        </div>
      </section>

      {/* ── Transfer Orders ───────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between gap-4 mb-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Transfer Orders ({filteredTransfers.length})
          </h2>
          <div className="flex gap-2">
            {darkStores.length > 0 && (
              <select
                value={filterLocId}
                onChange={e => setFilterLocId(e.target.value)}
                className="text-xs border border-gray-300 rounded px-2 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                <option value="">All Locations</option>
                {darkStores.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            )}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="text-xs border border-gray-300 rounded px-2 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="">All Statuses</option>
              {Object.entries(TRANSFER_STATUSES).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredTransfers.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-gray-600 font-medium">No transfer orders yet</p>
            <p className="text-gray-400 text-sm mt-1">
              {darkStores.length === 0
                ? 'Add a store or depot first, then create a transfer.'
                : 'Click "New Transfer" to send stock from the main warehouse to a store.'}
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-xs font-medium text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left">Order</th>
                  <th className="px-4 py-3 text-left">Destination</th>
                  <th className="px-4 py-3 text-left">Items</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTransfers.map(t => {
                  const st = TRANSFER_STATUSES[t.status] || {};
                  return (
                    <tr key={t.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Order ID */}
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs font-semibold text-gray-700">{t.orderId}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(t.createdAt)}</p>
                      </td>

                      {/* Destination */}
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-700">{t.toLocationName}</p>
                        <p className="text-xs text-gray-400">from Main Warehouse</p>
                      </td>

                      {/* Items summary */}
                      <td className="px-4 py-3 max-w-[200px]">
                        <div className="space-y-0.5">
                          {(t.items || []).slice(0, 2).map(i => (
                            <p key={i.productId} className="text-xs text-gray-600 truncate">
                              {i.productName} <span className="text-gray-400">× {i.quantity}</span>
                            </p>
                          ))}
                          {(t.items?.length || 0) > 2 && (
                            <p className="text-xs text-gray-400">
                              +{t.items.length - 2} more
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Status badge */}
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadge(st.color)}`}>
                          {st.label}
                        </span>
                      </td>

                      {/* Updated */}
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {formatDateTime(t.updatedAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {t.status === 'pending' && canApprove && (
                            <>
                              <button
                                onClick={() => handleApprove(t)}
                                className="text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-lg hover:bg-green-100 font-medium"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(t)}
                                className="text-xs bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-100"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {t.status === 'approved' && canManage && (
                            <button
                              onClick={() => handlePicking(t)}
                              className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg hover:bg-blue-100 font-medium"
                            >
                              Start Picking
                            </button>
                          )}
                          {t.status === 'picking' && canManage && (
                            <button
                              onClick={() => handleDispatch(t)}
                              className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-lg hover:bg-teal-100 font-medium"
                            >
                              Dispatched ↗
                            </button>
                          )}
                          {t.status === 'dispatched' && canManage && (
                            <button
                              onClick={() => setReceivingTO(t)}
                              className="text-xs bg-green-600 text-white px-2.5 py-1 rounded-lg hover:bg-green-700 font-medium"
                            >
                              ✓ Receive
                            </button>
                          )}
                          {/* Delete for draft-like or rejected states */}
                          {(t.status === 'rejected' || t.status === 'pending') && isAdmin && (
                            <button
                              onClick={() => deleteTransferOrder(t.id)}
                              className="text-gray-300 hover:text-red-500 text-base leading-none p-1"
                              title="Delete"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      {showAddLoc && (
        <LocationModal onClose={() => setShowAddLoc(false)} onSave={handleAddLoc} />
      )}
      {editingLoc && (
        <LocationModal initial={editingLoc} onClose={() => setEditingLoc(null)} onSave={handleEditLoc} />
      )}
      {showNewTransfer && (
        <NewTransferModal
          locations={locations}
          products={products}
          inventory={inventory}
          onClose={() => setShowNewTransfer(false)}
          onCreate={(data) => { createTransferOrder(data); setShowNewTransfer(false); }}
        />
      )}
      {receivingTO && (
        <ReceiveTransferModal
          transfer={receivingTO}
          onClose={() => setReceivingTO(null)}
          onConfirm={handleReceive}
        />
      )}
    </div>
  );
}
