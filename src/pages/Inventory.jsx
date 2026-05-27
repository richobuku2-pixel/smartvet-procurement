import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { getStockStatus } from '../utils/calculations';
import { formatCurrency, formatDateTime } from '../utils/formatter';
import AddFromCatalogueModal from '../components/inventory/AddFromCatalogueModal';
import EditProductModal from '../components/inventory/EditProductModal';
import StockCountModal from '../components/inventory/StockCountModal';
import SupplierSection from '../components/inventory/SupplierSection';

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function Inventory() {
  const { inventory, products, suppliers: suppliersMap, updateInventory, addProduct, updateProduct, deleteProduct, notify, recordStockCount, stockCounts, posApiUrl, setPosApiUrl } = useApp();
  const { currentUser } = useAuth();

  const [localInventory, setLocalInventory] = useState({ ...inventory });
  const [editMode, setEditMode]               = useState(false);
  const [search, setSearch]                   = useState('');
  const [statusFilter, setStatusFilter]       = useState('all');
  const [saving, setSaving]                   = useState(false);
  const [lastSaved, setLastSaved]             = useState(null);
  const [errors, setErrors]                   = useState({});
  const [sortField, setSortField]             = useState('');
  const [sortDir, setSortDir]                 = useState(1);
  const [showStockCount, setShowStockCount]   = useState(false);
  const [showAddModal, setShowAddModal]       = useState(false);
  const [editingProduct, setEditingProduct]             = useState(null);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState(null);

  const canManage = currentUser?.role === 'admin'
    || currentUser?.role === 'inventory_manager'
    || currentUser?.role === 'procurement_manager';

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = products.filter(p => {
    const q  = search.toLowerCase();
    const ok = !q || p.name.toLowerCase().includes(q)
      || (p.section || '').toLowerCase().includes(q)
      || p.supplier.toLowerCase().includes(q);
    const st = getStockStatus(p, localInventory[p.id] ?? 0);
    return ok && (statusFilter === 'all' || st === statusFilter);
  });

  // ── Group by supplier (preserving seed order) ────────────────────────────
  const grouped = useMemo(() => {
    const seen = [...new Set(products.map(p => p.supplier))];
    return seen.reduce((acc, sup) => {
      const prods = filtered.filter(p => p.supplier === sup);
      if (prods.length > 0) acc[sup] = prods;
      return acc;
    }, {});
  }, [products, filtered]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleChange = (productId, value) => {
    const num = parseInt(value, 10);
    const newErrors = { ...errors };
    if (value !== '' && (isNaN(num) || num < 0)) newErrors[productId] = true;
    else delete newErrors[productId];
    setErrors(newErrors);
    setLocalInventory(prev => ({ ...prev, [productId]: value === '' ? '' : Math.max(0, num) }));
  };

  const handleStockCountSave = useCallback(({ counts, countedBy, notes, source }) => {
    recordStockCount({ counts, countedBy, notes, source });
    setLocalInventory(prev => ({ ...prev, ...counts }));
    setShowStockCount(false);
    notify(`Stock count saved by ${countedBy} — inventory updated.`, 'success');
  }, [recordStockCount, notify]);

  const handleAddProduct = useCallback((data) => {
    const newProduct = addProduct(data);
    if (newProduct?.id) setLocalInventory(prev => ({ ...prev, [newProduct.id]: data.initialStock ?? 0 }));
  }, [addProduct]);

  const handleUpdateProduct = (data) => {
    updateProduct(editingProduct.id, data);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (product) => {
    deleteProduct(product.id);
    setDeleteConfirmProduct(null);
    const next = { ...localInventory };
    delete next[product.id];
    setLocalInventory(next);
  };

  const handleSave = () => {
    if (Object.keys(errors).length > 0) { notify('Fix invalid values first', 'error'); return; }
    const clean = {};
    products.forEach(p => {
      const v = localInventory[p.id];
      clean[p.id] = v === '' || isNaN(Number(v)) ? 0 : Number(v);
    });
    setSaving(true);
    setTimeout(() => {
      updateInventory(clean);
      setLastSaved(new Date().toISOString());
      setSaving(false);
    }, 300);
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d * -1);
    else { setSortField(field); setSortDir(1); }
  };

  // ── Stats ────────────────────────────────────────────────────────────────────
  const criticalCount = products.filter(p => getStockStatus(p, localInventory[p.id] ?? 0) === 'critical').length;
  const lowCount      = products.filter(p => getStockStatus(p, localInventory[p.id] ?? 0) === 'low').length;
  const okCount       = products.filter(p => getStockStatus(p, localInventory[p.id] ?? 0) === 'ok').length;
  const totalValue    = products.reduce((s, p) => s + (isNaN(Number(localInventory[p.id])) ? 0 : Number(localInventory[p.id])) * p.landedCost, 0);
  const retailValue   = products.reduce((s, p) => s + (isNaN(Number(localInventory[p.id])) ? 0 : Number(localInventory[p.id])) * p.retailPrice, 0);
  const unsavedCount  = Object.keys(errors).length;

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {showAddModal && (
        <AddFromCatalogueModal suppliers={suppliersMap} existingProducts={products}
          onAdd={handleAddProduct} onClose={() => setShowAddModal(false)} />
      )}
      {editingProduct && (
        <EditProductModal product={editingProduct} suppliers={suppliersMap}
          onSubmit={handleUpdateProduct} onClose={() => setEditingProduct(null)} />
      )}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900">Remove Product</h3>
            <p className="mt-2 text-sm text-gray-600">Remove <strong>{deleteConfirmProduct.name}</strong> from inventory? This cannot be undone.</p>
            <div className="mt-5 flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirmProduct(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDeleteProduct(deleteConfirmProduct)}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">Remove</button>
            </div>
          </div>
        </div>
      )}
      {showStockCount && (
        <StockCountModal
          currentInventory={localInventory}
          products={products}
          posApiUrl={posApiUrl}
          onPosApiUrlChange={setPosApiUrl}
          currentUser={currentUser}
          onSave={handleStockCountSave}
          onClose={() => setShowStockCount(false)}
        />
      )}

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Inventory</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {editMode
              ? <>Edit the <span className="font-semibold text-gray-700">Current Stock</span> column, then Save. Stock also updates automatically when orders are received.</>
              : <>{products.length} product{products.length !== 1 ? 's' : ''} tracked · stock updates automatically when orders are received.</>
            }
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canManage && (
            <button onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-green-700 text-white rounded-lg text-sm font-semibold hover:bg-green-800 shadow-sm">
              + Add from Catalogue
            </button>
          )}
          {canManage && !editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 border-2 border-teal-600 text-teal-700 bg-white rounded-lg text-sm font-semibold hover:bg-teal-50 shadow-sm"
            >
              ✎ Edit Stock
            </button>
          )}
          {editMode && (
            <>
              <button
                onClick={() => { setEditMode(false); setLocalInventory({ ...inventory }); setErrors({}); }}
                className="px-4 py-2.5 border border-gray-300 text-gray-600 bg-white rounded-lg text-sm font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-colors ${
                  unsavedCount > 0
                    ? 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-60'
                    : 'bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-60'
                }`}>
                {saving ? '⏳ Saving…' : unsavedCount > 0 ? '⚠ Fix errors first' : '💾 Save & Check Reorders'}
              </button>
            </>
          )}
        </div>
      </div>
      {editMode && (
        <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-lg px-4 py-2.5 text-sm text-teal-800">
          <span>✎</span>
          <span><strong>Edit mode on</strong> — type stock quantities directly in the table below, then Save. Click Cancel to discard all changes.</span>
        </div>
      )}

      {/* ── Summary cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
          <p className="text-xs text-gray-400 font-medium">Products Tracked</p>
          <p className="text-2xl font-bold text-gray-800 mt-0.5">{products.length}</p>
        </div>
        <div className={`border rounded-xl px-4 py-3 shadow-sm ${criticalCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
          <p className="text-xs text-gray-400 font-medium">Critical</p>
          <p className={`text-2xl font-bold mt-0.5 ${criticalCount > 0 ? 'text-red-600' : 'text-gray-300'}`}>{criticalCount}</p>
        </div>
        <div className={`border rounded-xl px-4 py-3 shadow-sm ${lowCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'}`}>
          <p className="text-xs text-gray-400 font-medium">Low Stock</p>
          <p className={`text-2xl font-bold mt-0.5 ${lowCount > 0 ? 'text-amber-600' : 'text-gray-300'}`}>{lowCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
          <p className="text-xs text-gray-400 font-medium">Cost Value</p>
          <p className="text-sm font-bold text-gray-800 mt-0.5 font-mono">{formatCurrency(totalValue)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
          <p className="text-xs text-gray-400 font-medium">Retail Value</p>
          <p className="text-sm font-bold text-green-700 mt-0.5 font-mono">{formatCurrency(retailValue)}</p>
        </div>
        {/* Stock Count card — doubles as the trigger */}
        <button
          onClick={() => setShowStockCount(true)}
          className="group text-left border-2 border-dashed border-teal-300 bg-teal-50/40 hover:bg-teal-50 hover:border-teal-500 rounded-xl px-4 py-3 shadow-sm transition-colors"
        >
          <p className="text-xs text-teal-600 font-medium flex items-center gap-1">
            <span>📋</span> Stock Count
          </p>
          {stockCounts[0] ? (
            <>
              <p className="text-sm font-bold text-gray-800 mt-0.5 leading-tight">
                {new Date(stockCounts[0].date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </p>
              <p className="text-[11px] text-teal-600 font-medium mt-0.5 group-hover:underline">Record new →</p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-amber-600 mt-0.5">Never done</p>
              <p className="text-[11px] text-teal-600 font-medium mt-0.5 group-hover:underline">Start count →</p>
            </>
          )}
        </button>
      </div>

      {/* ── Save confirmation ────────────────────────────────────────────────── */}
      {lastSaved && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
          <span>✓</span>
          <span>Saved at {formatDateTime(lastSaved)} — reorder check complete.</span>
        </div>
      )}

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input type="text" placeholder="Search products, suppliers or sections…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {[
            { val: 'all',      label: `All  (${products.length})` },
            { val: 'critical', label: `Critical  (${criticalCount})` },
            { val: 'low',      label: `Low  (${lowCount})` },
            { val: 'ok',       label: `OK  (${okCount})` },
          ].map(({ val, label }) => (
            <button key={val} onClick={() => setStatusFilter(val)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === val ? 'bg-white text-green-800 shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2 text-xs text-gray-400">
          <span className="text-gray-300">Sort:</span>
          {['name', 'stock', 'status'].map(f => (
            <button key={f} onClick={() => handleSort(f)}
              className={`px-2.5 py-1 rounded-md border capitalize transition-colors ${
                sortField === f ? 'border-green-400 bg-green-50 text-green-700 font-semibold' : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}>
              {f}{sortField === f ? (sortDir === 1 ? ' ↑' : ' ↓') : ''}
            </button>
          ))}
        </div>
      </div>

      {/* ── Product tables ───────────────────────────────────────────────────── */}
      {products.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-16 text-center">
          <p className="text-4xl mb-3">📦</p>
          <p className="font-semibold text-gray-700 text-lg">No products tracked yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-5">Supplier catalogues are loaded — add products to start tracking.</p>
          {canManage && (
            <button onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-green-700 text-white rounded-xl font-semibold hover:bg-green-800 text-sm">
              + Add Products from Catalogue
            </button>
          )}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
          No products match your search or filter.
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([sup, prods]) => (
            <SupplierSection
              key={sup}
              supplier={sup}
              supplierDetails={suppliersMap[sup] || {}}
              products={prods}
              localInventory={localInventory}
              onChange={handleChange}
              errors={errors}
              editMode={editMode}
              sortField={sortField}
              sortDir={sortDir}
              canManage={canManage}
              onEdit={setEditingProduct}
              onDelete={setDeleteConfirmProduct}
            />
          ))}

          {/* Grand total */}
          <div className="bg-gradient-to-r from-green-800 to-teal-700 rounded-xl px-6 py-4 flex items-center justify-between text-white shadow-md">
            <div>
              <p className="text-green-200 text-xs font-medium uppercase tracking-wider">Total Inventory Value (cost)</p>
              <p className="text-2xl font-black font-mono mt-0.5">{formatCurrency(totalValue)}</p>
            </div>
            <div className="text-right">
              <p className="text-green-200 text-xs font-medium uppercase tracking-wider">Potential Retail Revenue</p>
              <p className="text-2xl font-black font-mono mt-0.5">{formatCurrency(retailValue)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
