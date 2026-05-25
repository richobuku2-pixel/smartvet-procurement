import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { PRODUCTS } from '../data/seedData';
import CatalogueImportModal from '../components/CatalogueImportModal';
import { timeAgo } from '../utils/formatter';

// ── Availability check-in modal ───────────────────────────────────────────────
const STATUS_OPTS = [
  { value: 'skip',         label: '— Skip —'      },
  { value: 'in_stock',     label: '✓ In Stock'     },
  { value: 'low_stock',    label: '⚠ Low Stock'    },
  { value: 'out_of_stock', label: '✕ Out of Stock' },
];

function AvailabilityCheckinModal({ supplierName, catalogue, currentUser, onSave, onClose }) {
  const [tier, setTier]               = useState('manual');
  const [statuses, setStatuses]       = useState({});
  const [itemNotes, setItemNotes]     = useState({});
  const [checkinNotes, setCheckinNotes] = useState('');
  const [pasteText, setPasteText]     = useState('');
  const [parsedItems, setParsedItems] = useState(null);
  const [urlInput, setUrlInput]       = useState('');

  const setStatus = (id, val) => setStatuses(p => ({ ...p, [id]: val }));

  const parsePaste = () => {
    const lines = pasteText.split('\n').filter(l => l.trim());
    const parsed = [];
    for (const item of catalogue) {
      const keywords = item.name.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const matchLine = lines.find(l => {
        const ll = l.toLowerCase();
        return keywords.some(kw => ll.includes(kw));
      });
      if (!matchLine) continue;
      const ll = matchLine.toLowerCase();
      let status = 'in_stock';
      if (/out of stock|not available|unavailable|0 units|nil\b/.test(ll)) status = 'out_of_stock';
      else if (/low stock|limited|few left|running low/.test(ll)) status = 'low_stock';
      parsed.push({ id: item.id, name: item.name, status, matchLine });
    }
    setParsedItems(parsed);
  };

  const handleSave = () => {
    let checks = [];
    if (tier === 'manual') {
      checks = catalogue
        .filter(item => statuses[item.id] && statuses[item.id] !== 'skip')
        .map(item => ({ productId: item.id, productName: item.name, status: statuses[item.id], notes: itemNotes[item.id] || '' }));
    } else if (tier === 'paste' && parsedItems) {
      checks = parsedItems.map(p => ({ productId: p.id, productName: p.name, status: p.status, notes: '' }));
    }
    if (checks.length === 0) { alert('No products selected for logging.'); return; }
    onSave({
      supplier: supplierName,
      checks,
      checkedBy: currentUser?.name || currentUser?.email || 'Unknown',
      source: tier === 'url' ? 'url_scrape' : tier === 'paste' ? 'paste' : 'manual',
      notes: checkinNotes,
    });
    onClose();
  };

  const checkedCount = tier === 'manual'
    ? Object.values(statuses).filter(s => s && s !== 'skip').length
    : (parsedItems?.length || 0);

  const TIERS = [
    { key: 'manual', label: '📋 Manual Entry',    desc: 'Select products & set status' },
    { key: 'paste',  label: '📄 Paste Price List', desc: 'Paste email or WhatsApp text' },
    { key: 'url',    label: '🌐 URL / Scrape',     desc: 'Fetch from supplier website'  },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-14">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-700 to-teal-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {supplierName.charAt(0)}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">Log Availability Check-in</p>
            <p className="text-xs text-gray-400">{supplierName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-lg leading-none">✕</button>
        </div>

        {/* Tier selector */}
        <div className="flex gap-1.5 px-5 pt-3 pb-1">
          {TIERS.map(t => (
            <button key={t.key} onClick={() => setTier(t.key)}
              className={`flex-1 px-3 py-2 rounded-lg text-left transition-colors ${
                tier === t.key ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              <div className="text-xs font-semibold">{t.label}</div>
              <div className={`text-[10px] mt-0.5 ${tier === t.key ? 'text-teal-100' : 'text-gray-400'}`}>{t.desc}</div>
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">

          {/* ── Manual ── */}
          {tier === 'manual' && (
            <>
              <p className="text-xs text-gray-500">Set the current status for each product. "Skip" means it won't be recorded in this check-in.</p>
              {catalogue.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No catalogue items yet. Add products to this supplier's catalogue first.</p>
              ) : (
                <div className="space-y-1">
                  {catalogue.map(item => (
                    <div key={item.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">{item.name}</p>
                        {item.section && <p className="text-[10px] text-gray-400">{item.section}</p>}
                      </div>
                      <select
                        value={statuses[item.id] || 'skip'}
                        onChange={e => setStatus(item.id, e.target.value)}
                        className={`text-xs border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500 flex-shrink-0 ${
                          !statuses[item.id] || statuses[item.id] === 'skip'
                            ? 'text-gray-400 border-gray-200 bg-white'
                            : statuses[item.id] === 'in_stock'
                              ? 'text-green-700 border-green-200 bg-green-50'
                              : statuses[item.id] === 'low_stock'
                                ? 'text-amber-600 border-amber-200 bg-amber-50'
                                : 'text-red-600 border-red-200 bg-red-50'
                        }`}
                      >
                        {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Paste ── */}
          {tier === 'paste' && (
            <>
              <p className="text-xs text-gray-500">Paste a price list, email, or WhatsApp availability update. SmartVet will scan for known product names and infer their status.</p>
              <textarea
                value={pasteText}
                onChange={e => { setPasteText(e.target.value); setParsedItems(null); }}
                placeholder={"Paste price list or availability update here...\n\nExample:\nNewcastle Vaccine — In Stock — UGX 85,000\nGumboro Live — Out of Stock\nAmprolium 20% — Limited stock, 50 units left"}
                rows={7}
                className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono resize-none"
              />
              <button
                onClick={parsePaste}
                disabled={!pasteText.trim()}
                className="px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                🔍 Parse &amp; Preview
              </button>
              {parsedItems !== null && (
                <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                  <p className="text-xs font-semibold text-gray-600 mb-2">
                    {parsedItems.length === 0 ? 'No matches found.' : `${parsedItems.length} product${parsedItems.length !== 1 ? 's' : ''} detected:`}
                  </p>
                  {parsedItems.length === 0 ? (
                    <p className="text-xs text-gray-400">Try adjusting the paste text or switch to Manual Entry.</p>
                  ) : parsedItems.map(p => (
                    <div key={p.id} className="flex items-start gap-2 text-xs">
                      <span className={`flex-shrink-0 font-bold ${p.status === 'in_stock' ? 'text-green-600' : p.status === 'low_stock' ? 'text-amber-500' : 'text-red-500'}`}>
                        {p.status === 'in_stock' ? '✓' : p.status === 'low_stock' ? '⚠' : '✕'}
                      </span>
                      <span className="font-medium text-gray-800 flex-shrink-0">{p.name}</span>
                      <span className="text-gray-400 truncate">{p.matchLine}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── URL ── */}
          {tier === 'url' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">Enter the URL of the supplier's price list or website. SmartVet will fetch and scan the page for product availability.</p>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="https://supplier-website.com/pricelist"
                  className="flex-1 text-xs border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  disabled
                  className="px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-lg opacity-50 cursor-not-allowed"
                >
                  🌐 Fetch
                </button>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-700">
                <p className="font-semibold mb-0.5">🚧 Coming soon</p>
                <p>Automated URL scraping is being set up. Use <strong>Paste Price List</strong> or <strong>Manual Entry</strong> in the meantime.</p>
              </div>
            </div>
          )}

          {/* Check-in notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Check-in Notes (optional)</label>
            <input
              type="text"
              value={checkinNotes}
              onChange={e => setCheckinNotes(e.target.value)}
              placeholder="e.g. Spoke with Sales Team — prices valid until end of month"
              className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {checkedCount} product{checkedCount !== 1 ? 's' : ''} will be logged
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-xs border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button
              onClick={handleSave}
              disabled={checkedCount === 0}
              className="px-5 py-2 bg-green-700 text-white text-xs font-semibold rounded-lg hover:bg-green-800 disabled:opacity-50 transition-colors"
            >
              ✓ Save Check-in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  const { suppliers, products, addSupplier, updateSupplier, deleteSupplier, addCatalogueItem, deleteCatalogueItem, notify, availabilityLog, logAvailabilityCheck } = useApp();
  const { currentUser } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null); // { name, details }
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const [expandedCards, setExpandedCards] = useState({});
  const [activeTab, setActiveTab] = useState({}); // { [supplierName]: 'details' | 'catalogue' | 'availability' }
  const [importModal, setImportModal] = useState({ open: false, supplierName: null });
  const [showCheckinModal, setShowCheckinModal] = useState(null); // supplierName | null

  // Last-checked date per supplier (derived from availabilityLog)
  const lastCheckedBySupplier = useMemo(() => {
    const map = {};
    for (const entry of (availabilityLog || [])) {
      if (!map[entry.supplier] || new Date(entry.date) > new Date(map[entry.supplier])) {
        map[entry.supplier] = entry.date;
      }
    }
    return map;
  }, [availabilityLog]);

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
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Suppliers</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{Object.keys(suppliers || {}).length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Catalogue</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {Object.values(suppliers || {}).reduce((s, d) => s + (d.catalogue?.length || 0), 0)}
            <span className="text-sm font-normal text-gray-400 ml-1">products</span>
          </p>
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
        {/* Stale check-ins alert card */}
        {(() => {
          const stale = Object.keys(suppliers || {}).filter(n => {
            const lc = lastCheckedBySupplier[n];
            if (!lc) return true;
            return (Date.now() - new Date(lc)) > 7 * 86400000;
          });
          return (
            <div className={`rounded-xl border shadow-sm px-5 py-4 ${stale.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
              <p className={`text-xs font-medium uppercase tracking-wide ${stale.length > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                Stock Check-ins
              </p>
              <p className={`text-2xl font-bold mt-1 ${stale.length > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                {stale.length}
                <span className="text-sm font-normal ml-1">{stale.length > 0 ? 'need check' : 'all current'}</span>
              </p>
              {stale.length > 0 && (
                <p className="text-[10px] text-amber-500 mt-0.5 truncate">{stale.slice(0, 2).join(', ')}{stale.length > 2 ? ` +${stale.length - 2}` : ''}</p>
              )}
            </div>
          );
        })()}
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
                <div className="flex items-center gap-2 mx-4 flex-shrink-0 flex-wrap">
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
                  {/* Last-checked badge */}
                  {(() => {
                    const lc = lastCheckedBySupplier[name];
                    if (!lc) return (
                      <span className="text-xs bg-red-50 text-red-500 px-2.5 py-1 rounded-full font-medium">
                        ⚠ never checked
                      </span>
                    );
                    const daysSince = Math.floor((Date.now() - new Date(lc)) / 86400000);
                    const cls = daysSince <= 7
                      ? 'bg-green-50 text-green-700'
                      : daysSince <= 30
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-red-50 text-red-500';
                    return (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cls}`}>
                        ✓ {timeAgo(lc)}
                      </span>
                    );
                  })()}
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
                    onClick={e => { e.stopPropagation(); setShowCheckinModal(name); }}
                    className="text-xs px-3 py-1.5 rounded-lg border border-teal-300 bg-teal-50 text-teal-700 hover:bg-teal-100 font-medium flex items-center gap-1"
                    title="Log availability check-in for this supplier"
                  >
                    📋 Check-in
                  </button>
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
                        {['Details', 'Catalogue', 'Availability'].map(tab => {
                          const tabKey = tab.toLowerCase();
                          const isActive = (activeTab[name] || 'details') === tabKey;
                          const supplyLogs = (availabilityLog || []).filter(e => e.supplier === name);
                          return (
                            <button
                              key={tab}
                              onClick={() => setActiveTab(p => ({ ...p, [name]: tabKey }))}
                              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                                isActive ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-400 hover:text-gray-600'
                              }`}
                            >
                              {tab}
                              {tab === 'Catalogue' && (
                                <span className="ml-1.5 bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5 text-[10px]">
                                  {(details.catalogue || []).length}
                                </span>
                              )}
                              {tab === 'Availability' && supplyLogs.length > 0 && (
                                <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${isActive ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'}`}>
                                  {supplyLogs.length}
                                </span>
                              )}
                            </button>
                          );
                        })}
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

                        {(activeTab[name] || 'details') === 'availability' && (() => {
                          const supplyLogs = (availabilityLog || [])
                            .filter(e => e.supplier === name)
                            .sort((a, b) => new Date(b.date) - new Date(a.date));
                          return (
                            <div className="space-y-3">
                              {/* Sub-header */}
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500">
                                  {supplyLogs.length === 0
                                    ? 'No check-ins recorded yet.'
                                    : `${supplyLogs.length} check-in${supplyLogs.length !== 1 ? 's' : ''} · Last ${timeAgo(supplyLogs[0].date)}`}
                                </p>
                                <button
                                  onClick={() => setShowCheckinModal(name)}
                                  className="px-3 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 flex items-center gap-1.5"
                                >
                                  + Log Check-in
                                </button>
                              </div>

                              {/* Empty state */}
                              {supplyLogs.length === 0 ? (
                                <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                  <p className="text-3xl mb-2">📋</p>
                                  <p className="text-sm font-medium text-gray-500">No check-ins logged yet</p>
                                  <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                                    Regularly logging availability helps you avoid stockouts before placing orders.
                                  </p>
                                  <button
                                    onClick={() => setShowCheckinModal(name)}
                                    className="mt-3 px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700"
                                  >
                                    Log First Check-in
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                  {supplyLogs.map(entry => {
                                    const inStock  = (entry.checks || []).filter(c => c.status === 'in_stock').length;
                                    const lowStock = (entry.checks || []).filter(c => c.status === 'low_stock').length;
                                    const outStock = (entry.checks || []).filter(c => c.status === 'out_of_stock').length;
                                    return (
                                      <div key={entry.id} className="bg-white border border-gray-100 rounded-lg px-3 py-2.5 hover:border-gray-200 transition-colors">
                                        <div className="flex items-center justify-between mb-1.5">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-semibold text-gray-800">
                                              {new Date(entry.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                            <span className="text-[10px] text-gray-400">{timeAgo(entry.date)}</span>
                                            {entry.source === 'paste' && (
                                              <span className="text-[10px] bg-blue-50 text-blue-600 rounded-full px-1.5 py-0.5">paste</span>
                                            )}
                                            {entry.source === 'url_scrape' && (
                                              <span className="text-[10px] bg-purple-50 text-purple-600 rounded-full px-1.5 py-0.5">scrape</span>
                                            )}
                                          </div>
                                          <span className="text-[10px] text-gray-400 flex-shrink-0">by {entry.checkedBy}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-[11px] flex-wrap">
                                          {inStock  > 0 && <span className="text-green-600 font-medium">✓ {inStock} in stock</span>}
                                          {lowStock > 0 && <span className="text-amber-500 font-medium">⚠ {lowStock} low</span>}
                                          {outStock > 0 && <span className="text-red-500 font-medium">✕ {outStock} out of stock</span>}
                                          {(entry.checks || []).length === 0 && <span className="text-gray-400">No products logged</span>}
                                        </div>
                                        {entry.notes && (
                                          <p className="text-[10px] text-gray-400 mt-1 italic truncate">{entry.notes}</p>
                                        )}
                                        {/* Product detail pills */}
                                        {(entry.checks || []).filter(c => c.status !== 'in_stock').length > 0 && (
                                          <div className="flex flex-wrap gap-1 mt-1.5">
                                            {(entry.checks || []).filter(c => c.status !== 'in_stock').map(c => (
                                              <span key={c.productId}
                                                className={`text-[10px] rounded-full px-2 py-0.5 font-medium ${
                                                  c.status === 'low_stock' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-500'
                                                }`}>
                                                {c.status === 'low_stock' ? '⚠' : '✕'} {c.productName}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Availability check-in modal */}
      {showCheckinModal && (
        <AvailabilityCheckinModal
          supplierName={showCheckinModal}
          catalogue={(suppliers[showCheckinModal]?.catalogue) || []}
          currentUser={currentUser}
          onSave={logAvailabilityCheck}
          onClose={() => setShowCheckinModal(null)}
        />
      )}

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
