import { useState, useCallback, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import OrderStatusBadge from '../components/OrderStatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import EmailPreviewModal from '../components/EmailPreviewModal';
import PurchaseOrderModal from '../components/PurchaseOrderModal';
import ProductFinder from '../components/ProductFinder';
import PipelineBar from '../components/orders/PipelineBar';
import OrderDetailModal from '../components/orders/OrderDetailModal';
import AcknowledgeModal from '../components/orders/AcknowledgeModal';
import DispatchModal from '../components/orders/DispatchModal';
import ReceiveModal from '../components/orders/ReceiveModal';
import { formatCurrency, formatDate, formatDateTime, daysUntil } from '../utils/formatter';
import { ORDER_STATUSES, PO_PIPELINE } from '../data/seedData';
import { storage } from '../utils/storage';

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function Orders() {
  const {
    orders, updateOrderStatus, sendOrderEmail, deleteOrder,
    markAcknowledged, markDispatched, receiveOrder,
    hasPermission, notify, dispatch: appDispatch, modals,
  } = useApp();
  const { currentUser } = useAuth();

  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [view, setView]               = useState('active');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [emailOrder, setEmailOrder]   = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [poModalOpen, setPoModalOpen] = useState(false);
  const [poOrder, setPoOrder]         = useState(null);
  const [actionModal, setActionModal] = useState(null); // { type: 'acknowledge'|'dispatch'|'receive', order }
  const [showFinder, setShowFinder]   = useState(false);

  // Pre-open PO modal when ProductFinder triggers an order for a supplier
  useEffect(() => {
    const trigger = modals?.productFinderOrder;
    if (trigger?.supplierName) {
      setPoOrder({ supplier: trigger.supplierName });
      setPoModalOpen(true);
      appDispatch({ type: 'SET_MODAL', key: 'productFinderOrder', value: null });
    }
  }, [modals?.productFinderOrder, appDispatch]);

  const canAdvance = currentUser?.role === 'admin' || currentUser?.role === 'inventory_manager';

  const suppliers = [...new Set(orders.map(o => o.supplier))];
  const isActive  = o => !['received', 'rejected'].includes(o.status);

  const displayed = orders.filter(o => {
    if (view === 'active' && !isActive(o)) return false;
    if (view === 'history' && isActive(o)) return false;
    const q = search.toLowerCase();
    const matchSearch = !q || o.orderId?.toLowerCase().includes(q) ||
      o.supplier?.toLowerCase().includes(q) ||
      o.items?.some(i => i.productName?.toLowerCase().includes(q));
    const matchStatus   = statusFilter === 'all' || o.status === statusFilter;
    const matchSupplier = supplierFilter === 'all' || o.supplier === supplierFilter;
    return matchSearch && matchStatus && matchSupplier;
  }).sort((a, b) => new Date(b.updatedAt ?? b.createdAt) - new Date(a.updatedAt ?? a.createdAt));

  const handleSubmit = (order) => {
    updateOrderStatus(order.id, 'pending_procurement');
    notify(`Order ${order.orderId} submitted for procurement approval`, 'success');
  };

  const handleAcknowledge = useCallback((data) => {
    markAcknowledged(actionModal.order.id, data);
    setActionModal(null);
    setSelectedOrder(prev => prev?.id === actionModal.order.id
      ? { ...prev, status: 'supplier_acknowledged', supplierAcknowledgment: { ...data, acknowledgedAt: new Date().toISOString() } }
      : prev
    );
  }, [actionModal, markAcknowledged]);

  const handleDispatch = useCallback((data) => {
    markDispatched(actionModal.order.id, data);
    setActionModal(null);
    setSelectedOrder(prev => prev?.id === actionModal.order.id
      ? { ...prev, status: 'dispatched', shipment: { ...data, dispatchedAt: new Date().toISOString() } }
      : prev
    );
  }, [actionModal, markDispatched]);

  const handleReceive = useCallback((data) => {
    receiveOrder(actionModal.order.id, data);
    setActionModal(null);
    setSelectedOrder(null);
  }, [actionModal, receiveOrder]);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(storage.exportAll(), null, 2)], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `smartvet-orders-${new Date().toISOString().split('T')[0]}.json`,
    });
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // ETA display helper
  const getEtaChip = (order) => {
    if (order.status !== 'dispatched' || !order.shipment?.expectedDeliveryDate) return null;
    const days = daysUntil(order.shipment.expectedDeliveryDate);
    if (days === null) return null;
    const cls = days < 0 ? 'bg-red-100 text-red-700' : days === 0 ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700';
    const label = days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `ETA ${days}d`;
    return <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>;
  };

  const activeCounts = { total: orders.filter(isActive).length };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">

      {/* Action modals */}
      {actionModal?.type === 'acknowledge' && (
        <AcknowledgeModal order={actionModal.order} onConfirm={handleAcknowledge} onClose={() => setActionModal(null)} />
      )}
      {actionModal?.type === 'dispatch' && (
        <DispatchModal order={actionModal.order} onConfirm={handleDispatch} onClose={() => setActionModal(null)} />
      )}
      {actionModal?.type === 'receive' && (
        <ReceiveModal order={actionModal.order} onConfirm={handleReceive} onClose={() => setActionModal(null)} />
      )}

      {/* Order detail modal */}
      {selectedOrder && !actionModal && (
        <OrderDetailModal
          order={orders.find(o => o.id === selectedOrder.id) ?? selectedOrder}
          onClose={() => setSelectedOrder(null)}
          canAdvance={canAdvance}
          onAcknowledge={() => setActionModal({ type: 'acknowledge', order: selectedOrder })}
          onDispatch={() => setActionModal({ type: 'dispatch', order: selectedOrder })}
          onReceive={() => setActionModal({ type: 'receive', order: selectedOrder })}
        />
      )}

      <EmailPreviewModal
        order={emailOrder}
        onClose={() => setEmailOrder(null)}
        onConfirmSend={() => { sendOrderEmail(emailOrder); setEmailOrder(null); }}
      />
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Delete Order"
        message={`Delete ${deleteConfirm?.orderId}? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => { deleteOrder(deleteConfirm.id); setDeleteConfirm(null); }}
        onCancel={() => setDeleteConfirm(null)}
      />
      <PurchaseOrderModal
        isOpen={poModalOpen}
        onClose={() => { setPoModalOpen(false); setPoOrder(null); }}
        prefillOrder={poOrder}
      />

      {/* ── Product finder modal ────────────────────────────────────────── */}
      {showFinder && <ProductFinder onClose={() => setShowFinder(false)} />}

      {/* ── Find-a-product bar ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-teal-50 border border-teal-200 rounded-xl px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-teal-800">Not sure which supplier stocks what you need?</p>
          <p className="text-xs text-teal-600 mt-0.5">Search across all supplier catalogues instantly</p>
        </div>
        <button
          onClick={() => setShowFinder(true)}
          className="flex-shrink-0 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
        >
          🔍 Find a Product
        </button>
      </div>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Purchase Orders</h2>
          <p className="text-sm text-gray-500">
            {activeCounts.total} active · {orders.length} total · track from creation to warehouse receipt
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setPoOrder(null); setPoModalOpen(true); }}
            className="px-4 py-2.5 bg-red-900 text-white rounded-lg text-sm font-semibold hover:bg-red-800 flex items-center gap-1.5"
          >
            📄 Generate PO
          </button>
          <button onClick={handleExport}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
            Export JSON
          </button>
        </div>
      </div>

      {/* ── View toggle + filters ──────────────────────────────────────── */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {['active', 'history'].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                view === v ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {v === 'active' ? `Active (${activeCounts.total})` : 'History'}
            </button>
          ))}
        </div>
        <input type="text" placeholder="Search order, supplier, product…"
          value={search} onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-teal-500" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="all">All Statuses</option>
          {Object.entries(ORDER_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="all">All Suppliers</option>
          {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* ── Orders table ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {displayed.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            <p className="text-3xl mb-3">🧾</p>
            <p className="font-medium text-gray-600">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3 text-left">Order</th>
                  <th className="px-4 py-3 text-left">Supplier</th>
                  <th className="px-4 py-3 text-right">Value</th>
                  <th className="px-4 py-3 text-center">Progress</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Updated</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayed.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50/60 transition-colors group">

                    {/* Order ID */}
                    <td className="px-5 py-3.5">
                      <p className="font-mono font-semibold text-gray-800 text-xs">{order.orderId}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                    </td>

                    {/* Supplier */}
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-gray-800">{order.supplier}</p>
                      {getEtaChip(order)}
                    </td>

                    {/* Value */}
                    <td className="px-4 py-3.5 text-right font-mono font-medium text-gray-800">
                      {formatCurrency(order.totalCost)}
                    </td>

                    {/* Pipeline progress */}
                    <td className="px-4 py-3.5 text-center">
                      <PipelineBar status={order.status} />
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3.5">
                      <OrderStatusBadge status={order.status} />
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3.5 text-xs text-gray-400">
                      {formatDate(order.updatedAt ?? order.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => setSelectedOrder(order)}
                          className="text-xs text-teal-700 hover:underline font-medium">
                          Details
                        </button>

                        {order.status === 'draft' && (
                          <button onClick={() => handleSubmit(order)}
                            className="text-xs text-teal-700 hover:underline">Submit</button>
                        )}
                        {order.status === 'ready_to_send' && (
                          <button onClick={() => setEmailOrder(order)}
                            className="text-xs font-semibold text-green-700 hover:underline">Send</button>
                        )}
                        {order.status === 'sent' && canAdvance && (
                          <button onClick={() => setActionModal({ type: 'acknowledge', order })}
                            className="text-xs text-teal-600 hover:underline">Acknowledge</button>
                        )}
                        {order.status === 'supplier_acknowledged' && canAdvance && (
                          <button onClick={() => setActionModal({ type: 'dispatch', order })}
                            className="text-xs text-teal-600 hover:underline">Dispatched</button>
                        )}
                        {order.status === 'dispatched' && canAdvance && (
                          <button onClick={() => setActionModal({ type: 'receive', order })}
                            className="text-xs font-semibold text-green-700 hover:underline">Receive</button>
                        )}
                        {['ready_to_send', 'sent', 'received'].includes(order.status) && (
                          <button onClick={() => { setPoOrder(order); setPoModalOpen(true); }}
                            className="text-xs text-red-700 hover:underline">PO</button>
                        )}
                        {(order.status === 'draft' || order.status === 'rejected') && (
                          <button onClick={() => setDeleteConfirm(order)}
                            className="text-xs text-red-400 hover:underline opacity-0 group-hover:opacity-100">Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
