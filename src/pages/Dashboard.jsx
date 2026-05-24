import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import MetricCard from '../components/MetricCard';
import OrderStatusBadge from '../components/OrderStatusBadge';
import EmailPreviewModal from '../components/EmailPreviewModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatCurrency, formatDate, formatDaysAgo, daysUntil } from '../utils/formatter';
import { calculateSupplierBalance } from '../utils/calculations';
import { SUPPLIERS } from '../data/seedData';
import { useState } from 'react';

export default function Dashboard() {
  const { orders, supplierAccounts, suppliers, dispatch, updateOrderStatus, sendOrderEmail, hasPermission, notify } = useApp();
  const { currentUser } = useAuth();
  const [emailOrder, setEmailOrder] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const drafts = orders.filter(o => o.status === 'draft');
  const pendingApprovals = orders.filter(o => o.status === 'pending_procurement' || o.status === 'pending_accounts');
  const sentOrders = orders.filter(o => o.status === 'sent');
  const totalOutstanding = Object.values(supplierAccounts).reduce((s, a) => s + (a.balance || 0), 0);

  const activeOrders = orders.filter(o => o.status !== 'received');

  const handleAction = (order) => {
    const { status } = order;
    if (status === 'draft') {
      if (!hasPermission('view_orders') && !hasPermission('approve_procurement')) return notify('No permission', 'error');
      updateOrderStatus(order.id, 'pending_procurement');
      notify(`Order ${order.orderId} submitted for procurement approval`);
    } else if (status === 'pending_procurement') {
      if (!hasPermission('approve_procurement')) return notify('Only Procurement Manager can approve', 'error');
      dispatch({ type: 'SET_TAB', payload: 'approvals' });
    } else if (status === 'pending_accounts') {
      if (!hasPermission('approve_accounts')) return notify('Only Accounts Manager can approve', 'error');
      dispatch({ type: 'SET_TAB', payload: 'approvals' });
    } else if (status === 'ready_to_send') {
      setEmailOrder(order);
    }
  };

  const actionLabel = (status) => {
    if (status === 'draft') return 'Submit for Approval';
    if (status === 'pending_procurement') return 'Review (Procurement)';
    if (status === 'pending_accounts') return 'Review (Accounts)';
    if (status === 'ready_to_send') return 'Send Email';
    if (status === 'sent') return 'View Details';
    return 'View';
  };

  const actionColor = (status) => {
    if (status === 'ready_to_send') return 'bg-teal-700 text-white hover:bg-teal-800';
    if (status === 'sent') return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
    return 'bg-green-600 text-white hover:bg-green-700';
  };

  const upcomingDeliveries = orders.filter(o => o.status === 'sent' && !o.deliveryStatus?.actualDeliveryDate);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500">Procurement overview for SmartVet Africa</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Draft Orders" value={drafts.length} subtitle="Awaiting review" color="warning" onClick={() => dispatch({ type: 'SET_TAB', payload: 'orders' })} />
        <MetricCard title="Pending Approvals" value={pendingApprovals.length} subtitle="Procurement & Accounts" color="secondary" onClick={() => dispatch({ type: 'SET_TAB', payload: 'approvals' })} />
        <MetricCard title="Orders Sent" value={sentOrders.length} subtitle="Awaiting delivery" color="primary" />
        <MetricCard title="Outstanding Balance" value={formatCurrency(totalOutstanding)} subtitle="Total owed to suppliers" color="danger" onClick={() => dispatch({ type: 'SET_TAB', payload: 'supplier-accounts' })} />
      </div>

      {/* Admin Quick Actions */}
      {(currentUser?.role === 'admin' || hasPermission('approve_procurement')) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">Admin Panel</h3>
              <p className="text-xs text-gray-400 mt-0.5">Manage suppliers and system users</p>
            </div>
          </div>
          <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Add Supplier */}
            <button
              onClick={() => dispatch({ type: 'SET_TAB', payload: 'suppliers' })}
              className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-dashed border-green-200 hover:border-green-500 hover:bg-green-50 transition-all group text-center"
            >
              <span className="text-3xl">🏭</span>
              <div>
                <p className="font-semibold text-gray-800 text-sm group-hover:text-green-800">Manage Suppliers</p>
                <p className="text-xs text-gray-400 mt-0.5">{Object.keys(suppliers || {}).length} supplier{Object.keys(suppliers || {}).length !== 1 ? 's' : ''} · Add or edit</p>
              </div>
              <span className="text-xs px-3 py-1 bg-green-700 text-white rounded-full font-medium group-hover:bg-green-800">+ Add Supplier</span>
            </button>

            {/* Add User */}
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => dispatch({ type: 'SET_TAB', payload: 'users' })}
                className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-dashed border-teal-200 hover:border-teal-500 hover:bg-teal-50 transition-all group text-center"
              >
                <span className="text-3xl">👥</span>
                <div>
                  <p className="font-semibold text-gray-800 text-sm group-hover:text-teal-800">Manage Users</p>
                  <p className="text-xs text-gray-400 mt-0.5">Control access &amp; roles</p>
                </div>
                <span className="text-xs px-3 py-1 bg-teal-700 text-white rounded-full font-medium group-hover:bg-teal-800">+ Add User</span>
              </button>
            )}

            {/* Supplier Accounts shortcut */}
            <button
              onClick={() => dispatch({ type: 'SET_TAB', payload: 'supplier-accounts' })}
              className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-dashed border-green-200 hover:border-green-400 hover:bg-green-50 transition-all group text-center"
            >
              <span className="text-3xl">💼</span>
              <div>
                <p className="font-semibold text-gray-800 text-sm group-hover:text-green-800">Supplier Accounts</p>
                <p className="text-xs text-gray-400 mt-0.5">Payments &amp; balances</p>
              </div>
              <span className="text-xs px-3 py-1 bg-green-600 text-white rounded-full font-medium group-hover:bg-green-700">View Accounts</span>
            </button>

            {/* Reports shortcut */}
            <button
              onClick={() => dispatch({ type: 'SET_TAB', payload: 'reports' })}
              className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-dashed border-teal-200 hover:border-teal-400 hover:bg-teal-50 transition-all group text-center"
            >
              <span className="text-3xl">📊</span>
              <div>
                <p className="font-semibold text-gray-800 text-sm group-hover:text-teal-800">Reports</p>
                <p className="text-xs text-gray-400 mt-0.5">Analytics &amp; exports</p>
              </div>
              <span className="text-xs px-3 py-1 bg-teal-600 text-white rounded-full font-medium group-hover:bg-teal-700">View Reports</span>
            </button>
          </div>
        </div>
      )}

      {/* Active Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Active Orders</h3>
        </div>
        {activeOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No active orders. Update inventory to generate orders.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs font-medium uppercase tracking-wider">
                  <th className="px-5 py-3 text-left">Order ID</th>
                  <th className="px-5 py-3 text-left">Supplier</th>
                  <th className="px-5 py-3 text-left">Items</th>
                  <th className="px-5 py-3 text-right">Total Cost</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Created</th>
                  <th className="px-5 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {activeOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-mono text-xs text-gray-600">{order.orderId}</td>
                    <td className="px-5 py-3 font-medium text-gray-800">{order.supplier}</td>
                    <td className="px-5 py-3 text-gray-600">{order.items.length} product{order.items.length !== 1 ? 's' : ''}</td>
                    <td className="px-5 py-3 text-right font-mono font-medium text-gray-800">{formatCurrency(order.totalCost)}</td>
                    <td className="px-5 py-3"><OrderStatusBadge status={order.status} /></td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{formatDaysAgo(order.createdAt)}</td>
                    <td className="px-5 py-3">
                      {order.status !== 'sent' && (
                        <button
                          onClick={() => handleAction(order)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${actionColor(order.status)}`}
                        >
                          {actionLabel(order.status)}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upcoming Deliveries */}
      {upcomingDeliveries.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Upcoming Deliveries</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {upcomingDeliveries.map(order => {
              const sup = SUPPLIERS[order.supplier] || {};
              const sentDate = order.emailSent?.sentAt || order.updatedAt;
              const expectedDate = sentDate ? new Date(new Date(sentDate).getTime() + (sup.leadTimeDays || 7) * 86400000).toISOString() : null;
              const days = expectedDate ? daysUntil(expectedDate) : null;

              return (
                <div key={order.id} className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{order.supplier}</p>
                    <p className="text-xs text-gray-500">{order.orderId} · {order.items.length} item(s) · {formatCurrency(order.totalCost)}</p>
                  </div>
                  <div className="text-right">
                    {days !== null && (
                      <p className={`text-sm font-semibold ${days < 0 ? 'text-red-600' : days <= 2 ? 'text-amber-600' : 'text-green-600'}`}>
                        {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `In ${days} day${days !== 1 ? 's' : ''}`}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">{sup.contactEmail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <EmailPreviewModal
        order={emailOrder}
        onClose={() => setEmailOrder(null)}
        onConfirmSend={() => { sendOrderEmail(emailOrder); setEmailOrder(null); }}
      />
    </div>
  );
}
