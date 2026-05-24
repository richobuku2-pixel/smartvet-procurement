import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/formatter';
import { calculateSupplierBalance } from '../utils/calculations';
import { PRODUCTS, SUPPLIERS } from '../data/seedData';

export default function Reports() {
  const { orders, supplierAccounts, inventory } = useApp();

  const sentOrders = orders.filter(o => ['sent', 'received'].includes(o.status));

  // Spend by supplier
  const spendBySupplier = {};
  sentOrders.forEach(o => {
    spendBySupplier[o.supplier] = (spendBySupplier[o.supplier] || 0) + o.totalCost;
  });

  // Orders by status
  const countByStatus = {};
  orders.forEach(o => { countByStatus[o.status] = (countByStatus[o.status] || 0) + 1; });

  // Most ordered products
  const productOrderCount = {};
  sentOrders.forEach(o => {
    o.items.forEach(item => {
      productOrderCount[item.productName] = (productOrderCount[item.productName] || 0) + item.quantity;
    });
  });
  const topProducts = Object.entries(productOrderCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Payment aging
  const totalOutstanding = Object.values(supplierAccounts).reduce((s, a) => s + (a.balance || 0), 0);

  // Inventory value
  const inventoryValue = PRODUCTS.reduce((s, p) => s + (inventory[p.id] || 0) * p.landedCost, 0);
  const inventoryRetailValue = PRODUCTS.reduce((s, p) => s + (inventory[p.id] || 0) * p.retailPrice, 0);

  const maxSpend = Math.max(...Object.values(spendBySupplier), 1);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Reports & Analytics</h2>
        <p className="text-sm text-gray-500">Spend analysis, inventory value, and order metrics.</p>
      </div>

      {/* Key numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-500 font-medium">Total Orders</p>
          <p className="text-3xl font-bold text-teal-700 mt-1">{orders.length}</p>
          <p className="text-xs text-gray-400 mt-1">{sentOrders.length} sent to suppliers</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-500 font-medium">Total Spend (Sent)</p>
          <p className="text-2xl font-bold text-gray-800 mt-1 font-mono">{formatCurrency(sentOrders.reduce((s, o) => s + o.totalCost, 0))}</p>
          <p className="text-xs text-gray-400 mt-1">across all suppliers</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-500 font-medium">Outstanding Payables</p>
          <p className={`text-2xl font-bold mt-1 font-mono ${totalOutstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(totalOutstanding)}</p>
          <p className="text-xs text-gray-400 mt-1">owed to suppliers</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-500 font-medium">Inventory (at cost)</p>
          <p className="text-2xl font-bold text-gray-800 mt-1 font-mono">{formatCurrency(inventoryValue)}</p>
          <p className="text-xs text-gray-400 mt-1">Retail value: {formatCurrency(inventoryRetailValue)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spend by supplier */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Spend by Supplier</h3>
          {Object.keys(spendBySupplier).length === 0 ? (
            <p className="text-sm text-gray-400">No orders sent yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(spendBySupplier).sort((a, b) => b[1] - a[1]).map(([supplier, amount]) => (
                <div key={supplier}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium">{supplier}</span>
                    <span className="font-mono text-gray-600">{formatCurrency(amount)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-600 rounded-full" style={{ width: `${(amount / maxSpend) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order pipeline */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Order Pipeline</h3>
          <div className="space-y-2">
            {[
              { key: 'draft', label: 'Draft', color: 'bg-gray-400' },
              { key: 'pending_procurement', label: 'Pending Procurement', color: 'bg-green-500' },
              { key: 'pending_accounts', label: 'Pending Accounts', color: 'bg-teal-500' },
              { key: 'ready_to_send', label: 'Ready to Send', color: 'bg-green-400' },
              { key: 'sent', label: 'Sent', color: 'bg-teal-500' },
              { key: 'received', label: 'Received', color: 'bg-green-600' },
              { key: 'rejected', label: 'Rejected', color: 'bg-red-400' },
            ].map(({ key, label, color }) => (
              <div key={key} className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${color}`}></span>
                <span className="text-sm text-gray-700 flex-1">{label}</span>
                <span className="font-mono font-bold text-gray-800">{countByStatus[key] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top products */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Most Ordered Products</h3>
          {topProducts.length === 0 ? (
            <p className="text-sm text-gray-400">No orders sent yet.</p>
          ) : (
            <div className="space-y-2">
              {topProducts.map(([name, qty], i) => (
                <div key={name} className="flex items-center gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  <span className="flex-1 text-gray-700">{name}</span>
                  <span className="font-mono font-medium text-gray-600">{qty} units</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Supplier account summary */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Supplier Account Balances</h3>
          <div className="space-y-3">
            {Object.keys(SUPPLIERS).map(name => {
              const account = supplierAccounts[name];
              const balance = calculateSupplierBalance(account);
              const credits = (account?.credits || []).reduce((s, c) => s + c.amount, 0);
              const payments = (account?.payments || []).reduce((s, p) => s + p.amount, 0);

              return (
                <div key={name} className="border border-gray-100 rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">{name}</span>
                    <span className={`font-mono font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(balance)}</span>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500 mt-1">
                    <span>Ordered: {formatCurrency(credits)}</span>
                    <span>Paid: {formatCurrency(payments)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
