import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import OrderStatusBadge from '../components/OrderStatusBadge';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatter';
import { calculateSupplierBalance } from '../utils/calculations';

function ApprovalCard({ order, type, supplierAccount, suppliers, onApprove, onReject, canApprove }) {
  const [comments, setComments] = useState('');
  const sup = suppliers[order.supplier] || {};
  const balance = calculateSupplierBalance(supplierAccount);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-800">{order.supplier}</p>
          <p className="text-xs text-gray-400 mt-0.5">{order.orderId} · Created {formatDate(order.createdAt)}</p>
        </div>
        <div className="text-right">
          <p className="font-mono font-bold text-gray-900">{formatCurrency(order.totalCost)}</p>
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Items table */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Order Items</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
                <th className="pb-1.5 text-left">Product</th>
                <th className="pb-1.5 text-right">Qty</th>
                <th className="pb-1.5 text-right">Unit Cost</th>
                <th className="pb-1.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {order.items.map((item, i) => (
                <tr key={i}>
                  <td className="py-2 text-gray-800">{item.productName}</td>
                  <td className="py-2 text-right font-mono text-gray-600">{item.quantity} {item.unit}</td>
                  <td className="py-2 text-right font-mono text-gray-600">{formatCurrency(item.unitCost)}</td>
                  <td className="py-2 text-right font-mono font-medium">{formatCurrency(item.lineCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Context panel for accounts */}
        {type === 'accounts' && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="text-xs text-gray-500 font-medium mb-1">Supplier Account</p>
              <p className={`font-mono font-bold ${balance > 1500000 ? 'text-red-600' : balance > 800000 ? 'text-amber-600' : 'text-gray-800'}`}>{formatCurrency(balance)}</p>
              <p className="text-xs text-gray-400">Outstanding balance</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="text-xs text-gray-500 font-medium mb-1">Payment Terms</p>
              <p className="font-semibold text-gray-800">{sup.paymentTerms || 'Net 30'}</p>
              <p className="text-xs text-gray-400">Lead time: {sup.leadTimeDays}d</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="text-xs text-gray-500 font-medium mb-1">New Balance if Approved</p>
              <p className="font-mono font-bold text-gray-800">{formatCurrency(balance + order.totalCost)}</p>
              <p className="text-xs text-gray-400">After order credit</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="text-xs text-gray-500 font-medium mb-1">Supplier Contact</p>
              <p className="text-gray-800 text-xs">{sup.contactPerson}</p>
              <p className="text-xs text-gray-400">{sup.contactEmail}</p>
            </div>
          </div>
        )}

        {/* Procurement previous approval */}
        {type === 'accounts' && order.procurementApproval && (
          <div className="bg-green-50 rounded-lg p-3 text-sm">
            <p className="font-medium text-green-800 text-xs">Procurement Approved by {order.procurementApproval.approverName}</p>
            {order.procurementApproval.comments && <p className="text-green-700 text-xs mt-1 italic">"{order.procurementApproval.comments}"</p>}
          </div>
        )}

        {/* Comments */}
        {canApprove && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
              {type === 'procurement' ? 'Special Requests / Notes' : 'Payment Notes'}
            </label>
            <textarea
              value={comments}
              onChange={e => setComments(e.target.value)}
              rows={2}
              placeholder={type === 'procurement' ? 'e.g. Check delivery schedule...' : 'e.g. Schedule payment for the 15th...'}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>
        )}

        {/* Actions */}
        {canApprove ? (
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => onApprove(order, comments)}
              className="flex-1 py-2.5 bg-teal-700 text-white rounded-lg text-sm font-semibold hover:bg-teal-800 transition-colors"
            >
              {type === 'procurement' ? 'Approve Order' : 'Confirm Payment'}
            </button>
            <button
              onClick={() => onReject(order, comments)}
              className="px-4 py-2.5 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
            >
              Reject
            </button>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
            You don't have permission to approve this order. Switch your role to approve.
          </div>
        )}
      </div>
    </div>
  );
}

export default function Approvals() {
  const { orders, suppliers, supplierAccounts, updateOrderStatus, hasPermission, notify } = useApp();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('procurement');

  const procurementOrders = orders.filter(o => o.status === 'pending_procurement');
  const accountsOrders = orders.filter(o => o.status === 'pending_accounts');

  const approverName = currentUser?.name || currentUser?.email || 'Unknown';
  const approverId   = currentUser?.id   || currentUser?.email || 'unknown';

  const handleProcurementApprove = (order, comments) => {
    if (!hasPermission('approve_procurement')) return notify('No permission to approve procurement orders', 'error');
    updateOrderStatus(order.id, 'pending_accounts', {
      procurementApproval: { approvedAt: new Date().toISOString(), approverName, approverId, comments },
    });
    notify(`Order ${order.orderId} approved — forwarded to Accounts`);
  };

  const handleProcurementReject = (order, comments) => {
    updateOrderStatus(order.id, 'rejected', {
      procurementApproval: { approvedAt: new Date().toISOString(), approverName, approverId, comments: `REJECTED: ${comments}` },
    });
    notify(`Order ${order.orderId} rejected`, 'warning');
  };

  const handleAccountsApprove = (order, comments) => {
    if (!hasPermission('approve_accounts')) return notify('No permission to approve payment', 'error');
    updateOrderStatus(order.id, 'ready_to_send', {
      accountsApproval: { approvedAt: new Date().toISOString(), approverName, approverId, comments },
    });
    notify(`Order ${order.orderId} payment confirmed — ready to send`);
  };

  const handleAccountsReject = (order, comments) => {
    updateOrderStatus(order.id, 'rejected', {
      accountsApproval: { approvedAt: new Date().toISOString(), approverName, approverId, comments: `REJECTED: ${comments}` },
    });
    notify(`Order ${order.orderId} rejected by accounts`, 'warning');
  };

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Approval Workflow</h2>
        <p className="text-sm text-gray-500">Review and approve purchase orders through the procurement pipeline.</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('procurement')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'procurement' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Procurement Review
          {procurementOrders.length > 0 && (
            <span className="bg-green-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{procurementOrders.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('accounts')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'accounts' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Accounts Approval
          {accountsOrders.length > 0 && (
            <span className="bg-teal-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{accountsOrders.length}</span>
          )}
        </button>
      </div>

      {activeTab === 'procurement' && (
        <div className="space-y-4">
          {procurementOrders.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
              No orders pending procurement approval.
            </div>
          ) : (
            procurementOrders.map(order => (
              <ApprovalCard
                key={order.id}
                order={order}
                type="procurement"
                suppliers={suppliers}
                supplierAccount={supplierAccounts[order.supplier]}
                onApprove={handleProcurementApprove}
                onReject={handleProcurementReject}
                canApprove={hasPermission('approve_procurement')}
              />
            ))
          )}
        </div>
      )}

      {activeTab === 'accounts' && (
        <div className="space-y-4">
          {accountsOrders.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
              No orders pending accounts approval.
            </div>
          ) : (
            accountsOrders.map(order => (
              <ApprovalCard
                key={order.id}
                order={order}
                type="accounts"
                suppliers={suppliers}
                supplierAccount={supplierAccounts[order.supplier]}
                onApprove={handleAccountsApprove}
                onReject={handleAccountsReject}
                canApprove={hasPermission('approve_accounts')}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
