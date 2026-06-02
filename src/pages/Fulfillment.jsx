/**
 * Fulfillment — Outbound delivery management
 *
 * Tabs:
 *   Sales Orders — full pipeline from confirmed → delivered
 *   Riders       — rider registry with status management
 */
import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, timeAgo } from '../utils/formatter';
import NewSalesOrderModal from '../components/fulfillment/NewSalesOrderModal';
import SalesOrderModal, { STATUS_META } from '../components/fulfillment/SalesOrderModal';
import RiderModal from '../components/fulfillment/RiderModal';
import CommunicationsTab from '../components/fulfillment/CommunicationsTab';
import PerformanceTab from '../components/fulfillment/PerformanceTab';

// ── Pipeline stages in order ──────────────────────────────────────────────────
const PIPELINE = [
  { status: 'confirmed',  label: 'Confirmed',  icon: '📋', color: 'bg-blue-100 text-blue-700 border-blue-200'   },
  { status: 'picking',    label: 'Picking',    icon: '📦', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { status: 'packed',     label: 'Packed',     icon: '📫', color: 'bg-amber-100 text-amber-700 border-amber-200'  },
  { status: 'dispatched', label: 'Dispatched', icon: '🏍️', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { status: 'in_transit', label: 'In Transit', icon: '🚚', color: 'bg-sky-100 text-sky-700 border-sky-200'       },
  { status: 'delivered',  label: 'Delivered',  icon: '✅', color: 'bg-green-100 text-green-700 border-green-200' },
];

const TERMINAL = [
  { status: 'failed',    label: 'Failed',    icon: '❌', color: 'bg-red-100 text-red-600 border-red-200'  },
  { status: 'cancelled', label: 'Cancelled', icon: '🚫', color: 'bg-gray-100 text-gray-500 border-gray-200' },
];

const RIDER_STATUS = {
  available:   { label: 'Available',   dot: 'bg-green-400'  },
  on_delivery: { label: 'On Delivery', dot: 'bg-amber-400'  },
  off_duty:    { label: 'Off Duty',    dot: 'bg-gray-300'   },
};

const VEHICLE_ICON = { motorcycle: '🏍️', bicycle: '🚲', car: '🚗', van: '🚐' };

// ── Helpers ───────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const m = STATUS_META[status] || {};
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${m.color || 'bg-gray-100 text-gray-500'}`}>
      {m.icon} {m.label}
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Fulfillment() {
  const { salesOrders, riders, deleteRider, hasPermission } = useApp();
  const { currentUser } = useAuth();

  const canManageDeliveries = hasPermission('manage_deliveries');
  const canManageRiders     = hasPermission('manage_riders');

  const [activeTab, setActiveTab]       = useState('orders');
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [showNewRider, setShowNewRider] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editRider, setEditRider]       = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch]             = useState('');
  const [sortBy, setSortBy]             = useState('newest');

  // Counts per status
  const counts = useMemo(() => {
    const c = {};
    for (const o of salesOrders) c[o.status] = (c[o.status] || 0) + 1;
    return c;
  }, [salesOrders]);

  const activeCount = useMemo(() =>
    salesOrders.filter(o => ['confirmed','picking','packed','dispatched','in_transit'].includes(o.status)).length,
    [salesOrders]
  );

  // Filtered + sorted orders
  const filtered = useMemo(() => {
    let rows = salesOrders;
    if (filterStatus !== 'all') rows = rows.filter(o => o.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(o =>
        o.soNumber?.toLowerCase().includes(q) ||
        o.customer?.name?.toLowerCase().includes(q) ||
        o.deliveryZone?.toLowerCase().includes(q)
      );
    }
    return [...rows].sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'total')  return b.total - a.total;
      return 0;
    });
  }, [salesOrders, filterStatus, search, sortBy]);

  const riderCounts = useMemo(() => ({
    available:   riders.filter(r => r.status === 'available').length,
    on_delivery: riders.filter(r => r.status === 'on_delivery').length,
    off_duty:    riders.filter(r => r.status === 'off_duty').length,
  }), [riders]);

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">

      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Fulfillment</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {activeCount} active {activeCount === 1 ? 'delivery' : 'deliveries'} · {salesOrders.length} total orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Sub-tab toggle */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {[['orders','Sales Orders'],['riders','Riders'],['communications','Communications'],['performance','Performance']].map(([t,l]) => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${activeTab === t ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
                {l}
              </button>
            ))}
          </div>
          {activeTab === 'orders' && canManageDeliveries && (
            <button onClick={() => setShowNewOrder(true)}
              className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-xl transition-colors">
              + New Order
            </button>
          )}
          {activeTab === 'riders' && canManageRiders && (
            <button onClick={() => setShowNewRider(true)}
              className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-xl transition-colors">
              + Add Rider
            </button>
          )}
        </div>
      </div>

      {/* ── ORDERS TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'orders' && (
        <>
          {/* Pipeline bar */}
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setFilterStatus('all')}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${filterStatus === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
              All <span className="font-black">{salesOrders.length}</span>
            </button>
            {PIPELINE.map(({ status, label, icon, color }) => (
              <button key={status} onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${filterStatus === status ? `${color} ring-2 ring-offset-1 ring-green-500` : `${color} opacity-70 hover:opacity-100`}`}>
                {icon} {label}
                {counts[status] ? <span className="font-black ml-0.5">{counts[status]}</span> : <span className="opacity-40">0</span>}
              </button>
            ))}
            <div className="w-px bg-gray-200 self-stretch mx-1" />
            {TERMINAL.map(({ status, label, icon, color }) => (
              <button key={status} onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${filterStatus === status ? `${color} ring-2 ring-offset-1 ring-gray-400` : `${color} opacity-50 hover:opacity-80`}`}>
                {icon} {label}
                {counts[status] ? <span className="font-black ml-0.5">{counts[status]}</span> : ''}
              </button>
            ))}
          </div>

          {/* Filter bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by order, customer…"
                className="pl-7 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs w-52 focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 ml-auto">
              {[['newest','Newest'],['oldest','Oldest'],['total','By Value']].map(([k,l]) => (
                <button key={k} onClick={() => setSortBy(k)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${sortBy === k ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Orders table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {filtered.length === 0 ? (
              <div className="p-16 text-center">
                <p className="text-4xl mb-3">🚚</p>
                <p className="text-gray-500 font-semibold">
                  {salesOrders.length === 0 ? 'No sales orders yet' : 'No orders match your filter'}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  {salesOrders.length === 0
                    ? 'Click "+ New Order" to create your first outbound delivery'
                    : 'Try clearing the status filter'}
                </p>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-gray-500 font-semibold">Order</th>
                    <th className="px-4 py-3 text-left text-gray-500 font-semibold">Customer</th>
                    <th className="px-4 py-3 text-left text-gray-400 font-semibold hidden md:table-cell">Zone</th>
                    <th className="px-4 py-3 text-right text-gray-400 font-semibold hidden lg:table-cell">Total</th>
                    <th className="px-4 py-3 text-center text-gray-500 font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-gray-400 font-semibold hidden xl:table-cell">Rider</th>
                    <th className="px-4 py-3 text-left text-gray-400 font-semibold hidden lg:table-cell">Created</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(order => {
                    const rider = riders.find(r => r.id === order.assignedRiderId);
                    return (
                      <tr key={order.id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => setSelectedOrder(order)}>
                        <td className="px-4 py-3">
                          <p className="font-bold text-gray-800">{order.soNumber}</p>
                          <p className="text-[10px] text-gray-400">{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-700">{order.customer?.name}</p>
                          <p className="text-[10px] text-gray-400">{order.customer?.phone}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{order.deliveryZone}</td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-gray-700 whitespace-nowrap hidden lg:table-cell">
                          {formatCurrency(order.total)}
                          <span className={`block text-[9px] font-normal ${order.paymentStatus === 'paid' ? 'text-green-600' : order.paymentStatus === 'partial' ? 'text-amber-600' : 'text-red-400'}`}>
                            {order.paymentStatus || 'pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-4 py-3 hidden xl:table-cell">
                          {rider ? (
                            <span className="text-gray-600">{rider.name}</span>
                          ) : (
                            <span className="text-gray-300">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-400 hidden lg:table-cell whitespace-nowrap">
                          {timeAgo(order.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-gray-300 hover:text-gray-500">›</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            {filtered.length > 0 && (
              <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
                <p className="text-[11px] text-gray-400">
                  Showing {filtered.length} of {salesOrders.length} orders
                  {filterStatus !== 'all' ? ' (filtered)' : ''}
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── RIDERS TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'riders' && (
        <>
          {/* Rider summary */}
          <div className="flex gap-3 flex-wrap">
            {Object.entries(RIDER_STATUS).map(([status, meta]) => (
              <div key={status} className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
                <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} />
                <span className="text-sm font-bold text-gray-800">{riderCounts[status]}</span>
                <span className="text-xs text-gray-500">{meta.label}</span>
              </div>
            ))}
          </div>

          {/* Riders grid */}
          {riders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center shadow-sm">
              <p className="text-4xl mb-3">🏍️</p>
              <p className="text-gray-500 font-semibold">No riders registered yet</p>
              <p className="text-gray-400 text-sm mt-1">Click "+ Add Rider" to register your first delivery rider</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {riders.map(rider => {
                const statusMeta = RIDER_STATUS[rider.status] || RIDER_STATUS.off_duty;
                const activeOrders = salesOrders.filter(o =>
                  o.assignedRiderId === rider.id && ['dispatched','in_transit'].includes(o.status)
                ).length;
                return (
                  <div key={rider.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-base font-bold flex-shrink-0">
                          {rider.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">{rider.name}</p>
                          <p className="text-xs text-gray-400">{rider.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${statusMeta.dot}`} />
                        <span className="text-[10px] text-gray-500 font-semibold">{statusMeta.label}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                      <span>{VEHICLE_ICON[rider.vehicleType] || '🚗'} {rider.vehicleType}</span>
                      {rider.vehicleReg && <span className="text-gray-400">· {rider.vehicleReg}</span>}
                      <span>📍 {rider.zone}</span>
                    </div>

                    {activeOrders > 0 && (
                      <div className="mt-2 text-[10px] bg-amber-50 text-amber-700 px-2 py-1 rounded-lg font-semibold">
                        {activeOrders} active delivery{activeOrders > 1 ? 's' : ''}
                      </div>
                    )}

                    {canManageRiders && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                        <button onClick={() => setEditRider(rider)}
                          className="flex-1 text-xs py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-medium">
                          Edit
                        </button>
                        <button
                          onClick={() => { if (window.confirm(`Remove ${rider.name}?`)) deleteRider(rider.id); }}
                          className="text-xs py-1.5 px-3 border border-red-100 rounded-lg text-red-400 hover:bg-red-50 font-medium">
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── COMMUNICATIONS TAB ─────────────────────────────────────────────── */}
      {activeTab === 'communications' && <CommunicationsTab />}

      {/* ── PERFORMANCE TAB ────────────────────────────────────────────────── */}
      {activeTab === 'performance' && <PerformanceTab />}

      {/* Modals */}
      {showNewOrder && <NewSalesOrderModal onClose={() => setShowNewOrder(false)} />}
      {showNewRider && <RiderModal onClose={() => setShowNewRider(false)} />}
      {selectedOrder && (
        <SalesOrderModal
          order={salesOrders.find(o => o.id === selectedOrder.id) || selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
      {editRider && <RiderModal rider={editRider} onClose={() => setEditRider(null)} />}
    </div>
  );
}
