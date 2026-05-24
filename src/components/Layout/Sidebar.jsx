import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

const TABS = [
  { id: 'dashboard',         label: 'Dashboard',        icon: '🏠' },
  { id: 'inventory',         label: 'Inventory',        icon: '📦' },
  { id: 'orders',            label: 'Orders',           icon: '🧾' },
  { id: 'approvals',         label: 'Approvals',        icon: '✅' },
  { id: 'suppliers',         label: 'Suppliers',        icon: '🏭' },
  { id: 'supplier-accounts', label: 'Supplier Accounts',icon: '💼' },
  { id: 'reports',           label: 'Reports',          icon: '📊' },
  { id: 'network',           label: 'Store Network',    icon: '🏪' },
];

export default function Sidebar() {
  const { activeTab, orders, transferOrders, dispatch } = useApp();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const pendingApprovals = orders.filter(o => o.status === 'pending_procurement' || o.status === 'pending_accounts').length;
  const draftCount = orders.filter(o => o.status === 'draft').length;
  const pendingTransfers = transferOrders.filter(t => t.status === 'pending').length;

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col py-3 shadow-sm">
      {/* Brand accent strip */}
      <div className="mx-4 mb-3 h-0.5 bg-gradient-to-r from-green-600 to-teal-500 rounded-full opacity-50" />

      {TABS.map(tab => {
        const isActive = activeTab === tab.id;
        const badge = tab.id === 'approvals' && pendingApprovals > 0 ? pendingApprovals
          : tab.id === 'orders' && draftCount > 0 ? draftCount
          : tab.id === 'network' && pendingTransfers > 0 ? pendingTransfers
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

      {/* Footer branding */}
      <div className="mt-auto mx-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center leading-relaxed">SmartVet Africa<br/>Procurement v1.0</p>
      </div>
    </aside>
  );
}
