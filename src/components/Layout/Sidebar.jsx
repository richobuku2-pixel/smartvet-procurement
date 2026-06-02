import { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { getMarketIntelligence } from '../../utils/marketIntelligence';

// roles listed = which roles can see this tab; omit = all roles see it
const TABS = [
  { id: 'dashboard',           label: 'Dashboard',           icon: '🏠' },
  { id: 'inventory',           label: 'Inventory',           icon: '📦',  roles: ['admin','inventory_manager','procurement_manager'] },
  { id: 'orders',              label: 'Orders',              icon: '🧾',  roles: ['admin','procurement_manager','accounts_manager','inventory_manager'] },
  { id: 'approvals',           label: 'Approvals',           icon: '✅',  roles: ['admin','procurement_manager','accounts_manager'] },
  { id: 'suppliers',           label: 'Suppliers',           icon: '🏭',  roles: ['admin','procurement_manager'] },
  { id: 'supplier-accounts',   label: 'Supplier Accounts',   icon: '💼',  roles: ['admin','accounts_manager'] },
  { id: 'fulfillment',         label: 'Fulfillment',         icon: '🚚',  roles: ['admin','fulfillment_manager'] },
  { id: 'market-intelligence', label: 'Market Intelligence', icon: '🧠',  roles: ['admin','procurement_manager'] },
  { id: 'pricing-advisory',    label: 'Pricing Advisory',    icon: '💡',  roles: ['admin','procurement_manager','accounts_manager'] },
  { id: 'reports',             label: 'Reports',             icon: '📊',  roles: ['admin','accounts_manager','procurement_manager'] },
  { id: 'network',             label: 'Store Network',       icon: '🏪',  roles: ['admin','inventory_manager'] },
];

export default function Sidebar() {
  const { activeTab, orders, transferOrders, availabilityLog, priceLog, suppliers, salesOrders, dispatch } = useApp();
  const { currentUser } = useAuth();
  const isAdmin    = currentUser?.role === 'admin';
  const userRole   = currentUser?.role || 'admin';
  const visibleTabs = TABS.filter(t => !t.roles || t.roles.includes(userRole));
  const pendingApprovals = orders.filter(o => o.status === 'pending_procurement' || o.status === 'pending_accounts').length;
  const activeDeliveries = (salesOrders || []).filter(o => ['confirmed','picking','packed','dispatched','in_transit'].includes(o.status)).length;
  const draftCount = orders.filter(o => o.status === 'draft').length;
  const pendingTransfers = transferOrders.filter(t => t.status === 'pending').length;

  // Market intelligence alert badge — count critical + at-risk items
  const intelAlerts = useMemo(() => {
    const { counts } = getMarketIntelligence(availabilityLog, priceLog, suppliers);
    return (counts.critical || 0) + (counts.at_risk || 0);
  }, [availabilityLog, priceLog, suppliers]);

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col py-3 shadow-sm">
      {/* Brand accent strip */}
      <div className="mx-4 mb-3 h-0.5 bg-gradient-to-r from-green-600 to-teal-500 rounded-full opacity-50" />

      {visibleTabs.map(tab => {
        const isActive = activeTab === tab.id;
        const badge = tab.id === 'fulfillment' && activeDeliveries > 0 ? activeDeliveries
          : tab.id === 'approvals' && pendingApprovals > 0 ? pendingApprovals
          : tab.id === 'orders' && draftCount > 0 ? draftCount
          : tab.id === 'network' && pendingTransfers > 0 ? pendingTransfers
          : tab.id === 'market-intelligence' && intelAlerts > 0 ? intelAlerts
          : null;

        return (
          <button
            key={tab.id}
            onClick={() => dispatch({ type: 'SET_TAB', payload: tab.id })}
            className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-medium text-left transition-all ${
              isActive
                ? 'bg-green-50 text-green-800 border-r-4 border-green-700 font-semibold'
                : 'text-gray-600 hover:bg-gray-50 hover:text-green-800'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            <div className="flex items-center gap-3">
              <span className="w-5 text-center text-base">{tab.icon}</span>
              <span>{tab.label}</span>
            </div>
            {badge && (
              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {badge}
              </span>
            )}
          </button>
        );
      })}

      {/* Admin-only: User Management */}
      {isAdmin && (
        <>
          <div className="mx-4 my-2 h-px bg-gray-100" />
          <button
            onClick={() => dispatch({ type: 'SET_TAB', payload: 'users' })}
            className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-left transition-all ${
              activeTab === 'users'
                ? 'bg-green-50 text-green-800 border-r-4 border-green-700 font-semibold'
                : 'text-gray-500 hover:bg-gray-50 hover:text-green-800'
            }`}
          >
            <span className="w-5 text-center text-base">👥</span>
            <span>Users</span>
          </button>
        </>
      )}

    </aside>
  );
}
