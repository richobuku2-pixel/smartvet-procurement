import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatDateTime } from '../utils/formatter';
import { TRANSFER_STATUSES } from '../data/seedData';
import LocationModal from '../components/network/LocationModal';
import NewTransferModal from '../components/network/NewTransferModal';
import ReceiveTransferModal from '../components/network/ReceiveTransferModal';
import LocationCard from '../components/network/LocationCard';

// ── Helpers ───────────────────────────────────────────────────────────────────
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
