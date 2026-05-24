import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { PRODUCTS } from '../data/seedData';
import CatalogueImportModal from '../components/CatalogueImportModal';

// ── Catalogue item form ───────────────────────────────────────────────────────
const EMPTY_CAT_ITEM = { name: '', section: '', spec: '', indication: '', unit: '', priority: '★', note: '' };

function CatalogueManager({ supplierName, catalogue = [], canManage, onAdd, onDelete, onOpenImport }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_CAT_ITEM);
  const [search, setSearch] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleAdd = () => {
    if (!form.name.trim()) return;
    onAdd(supplierName, { ...form, id: `ITEM-${Date.now()}` });
    setForm(EMPTY_CAT_ITEM);
    setShowForm(false);
  };

  const filtered = catalogue.filter(i =>
    !search || i.name.toLowerCase().includes(search.toLowerCase()) || (i.section || '').toLowerCase().includes(search.toLowerCase())
  );

  const fieldCls = 'border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-700">Catalogue ({catalogue.length} products)</span>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search…" className={`${fieldCls} pl-6 w-44`} />
          </div>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenImport}
              className="text-xs px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-semibold flex items-center gap-1.5"
            >
              📥 Import Catalogue
            </button>
            <button onClick={() => setShowForm(p => !p)}
              className="text-xs px-3 py-1.5 bg-green-700 text-white rounded-lg hover:bg-green-800 font-semibold">
              + Add Item
            </button>
          </div>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white border border-green-200 rounded-lg p-3 space-y-2">
          <p className="text-xs font-semibold text-green-700 mb-2">New Catalogue Item</p>
          <div className="grid grid-cols-2 gap-2">
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Product name *" className={`${fieldCls} col-span-2`} />
            <input value={form.section} onChange={e => set('section', e.target.value)} placeholder="Section (e.g. Poultry Vaccines)" className={fieldCls} />
            <input value={form.unit} onChange={e => set('unit', e.target.value)} placeholder="Unit (e.g. vials, bottles)" className={fieldCls} />
            <input value={form.spec} onChange={e => set('spec', e.target.value)} placeholder="Spec / dosage" className={fieldCls} />
            <select value={form.priority} onChange={e => set('priority', e.target.value)} className={fieldCls}>
              <option value="★★★">★★★ High Priority</option>
              <option value="★★">★★ Medium Priority</option>
              <option value="★">★ Low Priority</option>
            </select>
            <input value={form.indication} onChange={e => set('indication', e.target.value)} placeholder="Indication / use" className={`${fieldCls} col-span-2`} />
            <input value={form.note} onChange={e => set('note', e.target.value)} placeholder="Notes (storage, dosage, etc.)" className={`${fieldCls} col-span-2`} />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleAdd} className="px-4 py-1.5 bg-green-700 text-white rounded-lg text-xs font-semibold hover:bg-green-800">Add Item</button>
            <button onClick={() => { setShowForm(false); setForm(EMPTY_CAT_ITEM); }} className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      {/* Catalogue items */}
      {filtered.length === 0 ? (
        <div className="py-6 text-center text-sm text-gray-400">
          {catalogue.length === 0 ? 'No catalogue items yet. Add products above.' : 'No results for your search.'}
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto space-y-1">
          {filtered.map(item => (
            <div key={item.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-lg px-3 py-2 text-xs hover:border-gray-200">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={item.priority === '★★★' ? 'text-red-500' : item.priority === '★★' ? 'text-amber-500' : 'text-gray-300'}>
                    {item.priority || '★'}
                  </span>
                  <span className="font-medium text-gray-800 truncate">{item.name}</span>
                  {item.unit && <span className="text-gray-400 flex-shrink-0">· {item.unit}</span>}
                </div>
                {item.section && <p className="text-gray-400 mt-0.5">{item.section}</p>}
              </div>
              {canManage && (
                <button onClick={() => onDelete(supplierName, item.id)}
                  className="text-red-400 hover:text-red-600 flex-shrink-0 text-xs px-2 py-1 rounded hover:bg-red-50">
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const PAYMENT_TERMS = ['Net 15', 'Net 30', 'Net 60', 'Cash on Delivery', 'Prepayment'];

const EMPTY_FORM = {
  name: '',
  contactEmail: '',
  contactPerson: '',
  phone: '',
  location: '',
  paymentTerms: 'Net 30',
  minimumOrderQuantity: 1,
  leadTimeDays: 7,
  notes: '',
};

function SupplierForm({ initial, isNew, onSubmit, onCancel }) {
  const [form, setForm] = useState(
    isNew ? EMPTY_FORM : {
      name: initial?.name || '',
      contactEmail: initial?.details?.contactEmail || '',
      contactPerson: initial?.details?.contactPerson || '',
      phone: initial?.details?.phone || '',
      location: initial?.details?.location || '',
      paymentTerms: initial?.details?.paymentTerms || 'Net 30',
      minimumOrderQuantity: initial?.details?.minimumOrderQuantity ?? 1,
      leadTimeDays: initial?.details?.leadTimeDays ?? 7,
      notes: initial?.details?.notes || '',
    }
  );
  const [error, setError] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Supplier name is required.'); return; }
    if (!form.contactEmail.trim()) { setError('Contact email is required.'); return; }
    if (form.minimumOrderQuantity < 1) { setError('Minimum order quantity must be at least 1.'); return; }
    if (form.leadTimeDays < 1) { setError('Lead time must be at least 1 day.'); return; }
    setError('');
    const { name, ...details } = form;
    onSubmit(name.trim(), {
      contactEmail: details.contactEmail.trim(),
      contactPerson: details.contactPerson.trim(),
      phone: details.phone.trim(),
      location: details.location.trim(),
      paymentTerms: details.paymentTerms,
      minimumOrderQuantity: Number(details.minimumOrderQuantity),
      leadTimeDays: Number(details.leadTimeDays),
      notes: details.notes.trim(),
    });
  };

  const fieldClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent';
  const labelClass = 'block text-xs font-semibold text-gray-500 uppercase mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg flex items-center gap-2">
          <span>⚠️</span><span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Supplier Name */}
        <div className="col-span-2">
          <label className={labelClass}>Supplier Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="e.g. Eram Uganda Ltd"
            disabled={!isNew}
            className={`${fieldClass} ${!isNew ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
            required
          />
          {!isNew && (
            <p className="text-xs text-amber-600 mt-1">⚠️ Supplier name cannot be changed (products are linked by name).</p>
          )}
        </div>

        {/* Contact Email */}
        <div>
          <label className={labelClass}>Contact Email *</label>
          <input type="email" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)}
            placeholder="orders@supplier.ug" className={fieldClass} required />
        </div>

        {/* Contact Person */}
        <div>
          <label className={labelClass}>Contact Person</label>
          <input type="text" value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)}
            placeholder="Sales Manager" className={fieldClass} />
        </div>

        {/* Phone */}
        <div>
          <label className={labelClass}>Phone Number</label>
          <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
            placeholder="+256 700 000000" className={fieldClass} />
        </div>

        {/* Location */}
        <div>
          <label className={labelClass}>Location</label>
          <input type="text" value={form.location} onChange={e => set('location', e.target.value)}
            placeholder="Kampala, Uganda" className={fieldClass} />
        </div>

        {/* Payment Terms */}
        <div>
          <label className={labelClass}>Payment Terms</label>
          <select value={form.paymentTerms} onChange={e => set('paymentTerms', e.target.value)} className={fieldClass}>
            {PAYMENT_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* MOQ */}
        <div>
          <label className={labelClass}>Min. Order Qty (MOQ)</label>
          <input type="number" min="1" value={form.minimumOrderQuantity}
            onChange={e => set('minimumOrderQuantity', e.target.value)} className={fieldClass} />
        </div>

        {/* Lead Time */}
        <div>
          <label className={labelClass}>Lead Time (days)</label>
          <input type="number" min="1" value={form.leadTimeDays}
            onChange={e => set('leadTimeDays', e.target.value)} className={fieldClass} />
        </div>

        {/* Notes */}
        <div className="col-span-2">
          <label className={labelClass}>Notes</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
            placeholder="Any additional notes about this supplier..."
            rows={2} className={`${fieldClass} resize-none`} />
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button type="submit"
          className="flex-1 py-2.5 bg-green-700 text-white rounded-lg text-sm font-semibold hover:bg-green-800 transition-colors">
          {isNew ? '+ Add Supplier' : 'Save Changes'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function Suppliers() {
  const { suppliers, products, addSupplier, updateSupplier, deleteSupplier, addCatalogueItem, deleteCatalogueItem, notify } = useApp();
  const { currentUser } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null); // { name, details }
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const [expandedCards, setExpandedCards] = useState({});
  const [activeTab, setActiveTab] = useState({}); // { [supplierName]: 'details' | 'catalogue' }
  const [importModal, setImportModal] = useState({ open: false, supplierName: null });

  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'procurement_manager';

  // Count products per supplier
  const productCounts = useMemo(() => {
    const allProducts = products || PRODUCTS;
    return allProducts.reduce((acc, p) => {
      acc[p.supplier] = (acc[p.supplier] || 0) + 1;
      return acc;
    }, {});
  }, [products]);

  const supplierList = Object.entries(suppliers || {})
    .filter(([name]) => name.toLowerCase().includes(search.toLowerCase()))
    .sort(([a], [b]) => a.localeCompare(b));

  const toggleExpand = (name) => setExpandedCards(p => ({ ...p, [name]: !p[name] }));

  const handleAdd = (name, details) => {
    try {
      addSupplier(name, details);
      setShowForm(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdate = (name, details) => {
    try {
      updateSupplier(name, details);
      setEditingSupplier(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = (name) => {
    deleteSupplier(name);
    setDeleteConfirm(null);
  };

  const productCountForSupplier = (name) => productCounts[name] || 0;

  const handleCatalogueImport = (supplierName, newItems, mode) => {
    const existing = suppliers[supplierName]?.catalogue || [];
    const catalogue = mode === 'replace'
      ? newItems
      : [...existing, ...newItems];
    updateSupplier(supplierName, { catalogue });
    notify(`${newItems.length} product${newItems.length !== 1 ? 's' : ''} ${mode === 'replace' ? 'imported (catalogue replaced)' : 'added to catalogue'} for ${supplierName}.`, 'success');
  };

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Suppliers</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {supplierList.length} supplier{supplierList.length !== 1 ? 's' : ''} · Manage contact details, MOQ &amp; payment terms
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => { setShowForm(true); setEditingSupplier(null); }}
            className="px-4 py-2.5 bg-green-700 text-white rounded-lg text-sm font-semibold hover:bg-green-800 flex items-center gap-2 shadow-sm"
          >
            + Add Supplier
          </button>
        )}
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Suppliers</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{Object.keys(suppliers || {}).length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Products</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{PRODUCTS.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Avg. Lead Time</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {supplierList.length > 0
              ? Math.round(supplierList.reduce((s, [, d]) => s + (d.leadTimeDays || 0), 0) / supplierList.length)
              : 0}
            <span className="text-sm font-normal text-gray-400 ml-1">days</span>
          </p>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-green-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-5 bg-green-600 rounded-full" />
            <h3 className="font-semibold text-gray-800">New Supplier</h3>
          </div>
          <SupplierForm isNew onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Search */}
      <div className="relative w-72">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        <input
          type="text"
          placeholder="Search suppliers..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Supplier cards */}
      <div className="space-y-3">
        {supplierList.length === 0 && (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <p className="text-4xl mb-3">🏭</p>
            <p className="text-gray-500 font-medium">No suppliers found</p>
            <p className="text-gray-400 text-sm mt-1">
              {search ? 'Try a different search term.' : 'Add your first supplier to get started.'}
            </p>
          </div>
        )}

        {supplierList.map(([name, details]) => {
          const isEditing = editingSupplier?.name === name;
          const isExpanded = expandedCards[name];
          const pCount = productCountForSupplier(name);

          return (
            <div key={name} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Card header */}
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-600 to-teal-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{details.contactEmail || '—'}</p>
                  </div>
                </div>

                {/* Meta tags */}
                <div className="flex items-center gap-2 mx-4 flex-shrink-0">
                  <span className="text-xs bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full font-medium">
                    📋 {(details.catalogue || []).length} catalogue
                  </span>
                  <span className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-medium">
                    MOQ: {details.minimumOrderQuantity ?? '—'}
                  </span>
                  <span className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-medium">
                    {details.leadTimeDays ?? '—'}d lead
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                    {details.paymentTerms || 'Net 30'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {canManage && (
                    <>
                      <button
                        onClick={() => { setEditingSupplier({ name, details }); setShowForm(false); setExpandedCards(p => ({ ...p, [name]: true })); }}
                        className="text-xs px-3 py-1.5 rounded-lg border border-teal-200 text-teal-700 hover:bg-teal-50 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(name)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 font-medium"
                      >
                        Remove
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => toggleExpand(name)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 font-medium"
                  >
                    {isExpanded ? '▲ Less' : '▼ Details'}
                  </button>
                </div>
              </div>

              {/* Expanded: tabs for Details / Catalogue / Edit */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50/50">
                  {isEditing ? (
                    <div className="px-5 py-4">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-5 bg-teal-600 rounded-full" />
                        <h4 className="font-semibold text-gray-700 text-sm">Edit Supplier</h4>
                      </div>
                      <SupplierForm
                        initial={{ name, details }}
                        isNew={false}
                        onSubmit={handleUpdate}
                        onCancel={() => setEditingSupplier(null)}
                      />
                    </div>
                  ) : (
                    <>
                      {/* Tab bar */}
                      <div className="flex gap-0 border-b border-gray-100 px-5">
                        {['Details', 'Catalogue'].map(tab => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(p => ({ ...p, [name]: tab.toLowerCase() }))}
                            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                              (activeTab[name] || 'details') === tab.toLowerCase()
                                ? 'border-teal-600 text-teal-700'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            {tab}
                            {tab === 'Catalogue' && (
                              <span className="ml-1.5 bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5 text-[10px]">
                                {(details.catalogue || []).length}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Tab content */}
                      <div className="px-5 py-4">
                        {(activeTab[name] || 'details') === 'details' && (
                          <div className="grid grid-cols-3 gap-x-8 gap-y-3 text-sm">
                            <div>
                              <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-0.5">Contact Person</p>
                              <p className="text-gray-800">{details.contactPerson || '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-0.5">Phone</p>
                              <p className="text-gray-800">{details.phone || '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-0.5">Location</p>
                              <p className="text-gray-800">{details.location || '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-0.5">Payment Terms</p>
                              <p className="text-gray-800">{details.paymentTerms || 'Net 30'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-0.5">Min. Order Qty</p>
                              <p className="text-gray-800">{details.minimumOrderQuantity ?? '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-0.5">Lead Time</p>
                              <p className="text-gray-800">{details.leadTimeDays ? `${details.leadTimeDays} days` : '—'}</p>
                            </div>
                            {details.notes && (
                              <div className="col-span-3">
                                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-0.5">Notes</p>
                                <p className="text-gray-700 bg-white rounded-lg border border-gray-100 px-3 py-2 text-sm">{details.notes}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {(activeTab[name] || 'details') === 'catalogue' && (
                          <CatalogueManager
                            supplierName={name}
                            catalogue={details.catalogue || []}
                            canManage={canManage}
                            onAdd={addCatalogueItem}
                            onDelete={deleteCatalogueItem}
                            onOpenImport={() => setImportModal({ open: true, supplierName: name })}
                          />
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900">Remove Supplier</h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to remove <strong>{deleteConfirm}</strong>?
            </p>
            {productCountForSupplier(deleteConfirm) > 0 && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-700">
                ⚠️ This supplier has <strong>{productCountForSupplier(deleteConfirm)} product(s)</strong> linked to it.
                Those products will still show in inventory but won't be associated with an active supplier.
              </div>
            )}
            <div className="mt-5 flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Catalogue Import Modal */}
      <CatalogueImportModal
        isOpen={importModal.open}
        onClose={() => setImportModal({ open: false, supplierName: null })}
        supplierName={importModal.supplierName || ''}
        onImport={(items, mode) => {
          if (importModal.supplierName) {
            handleCatalogueImport(importModal.supplierName, items, mode);
          }
          setImportModal({ open: false, supplierName: null });
        }}
      />
    </div>
  );
}
