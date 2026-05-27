/**
 * CatalogueManager
 *
 * Inline panel showing a supplier's catalogue with search, add, and delete.
 * Rendered inside the expanded supplier card under the "Catalogue" tab.
 *
 * Props:
 *   supplierName  — string
 *   catalogue     — array of { id, name, section, unit, spec, indication, priority, note }
 *   canManage     — boolean (admin / procurement_manager)
 *   onAdd         — fn(supplierName, item)
 *   onDelete      — fn(supplierName, itemId)
 *   onOpenImport  — fn() — opens the CatalogueImportModal
 */
import { useState } from 'react';

const EMPTY_CAT_ITEM = {
  name: '', section: '', spec: '', indication: '', unit: '', priority: '★', note: '',
};

export default function CatalogueManager({ supplierName, catalogue = [], canManage, onAdd, onDelete, onOpenImport }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY_CAT_ITEM);
  const [search, setSearch]     = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleAdd = () => {
    if (!form.name.trim()) return;
    onAdd(supplierName, { ...form, id: `ITEM-${Date.now()}` });
    setForm(EMPTY_CAT_ITEM);
    setShowForm(false);
  };

  const filtered = catalogue.filter(i =>
    !search
    || i.name.toLowerCase().includes(search.toLowerCase())
    || (i.section || '').toLowerCase().includes(search.toLowerCase())
  );

  const fieldCls = 'border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500';

  return (
    <div className="space-y-3">
      {/* Toolbar */}
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
            <button
              onClick={() => setShowForm(p => !p)}
              className="text-xs px-3 py-1.5 bg-green-700 text-white rounded-lg hover:bg-green-800 font-semibold"
            >
              + Add Item
            </button>
          </div>
        )}
      </div>

      {/* Add item form */}
      {showForm && (
        <div className="bg-white border border-green-200 rounded-lg p-3 space-y-2">
          <p className="text-xs font-semibold text-green-700 mb-2">New Catalogue Item</p>
          <div className="grid grid-cols-2 gap-2">
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="Product name *" className={`${fieldCls} col-span-2`} />
            <input value={form.section} onChange={e => set('section', e.target.value)}
              placeholder="Section (e.g. Poultry Vaccines)" className={fieldCls} />
            <input value={form.unit} onChange={e => set('unit', e.target.value)}
              placeholder="Unit (e.g. vials, bottles)" className={fieldCls} />
            <input value={form.spec} onChange={e => set('spec', e.target.value)}
              placeholder="Spec / dosage" className={fieldCls} />
            <select value={form.priority} onChange={e => set('priority', e.target.value)} className={fieldCls}>
              <option value="★★★">★★★ High Priority</option>
              <option value="★★">★★ Medium Priority</option>
              <option value="★">★ Low Priority</option>
            </select>
            <input value={form.indication} onChange={e => set('indication', e.target.value)}
              placeholder="Indication / use" className={`${fieldCls} col-span-2`} />
            <input value={form.note} onChange={e => set('note', e.target.value)}
              placeholder="Notes (storage, dosage, etc.)" className={`${fieldCls} col-span-2`} />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleAdd}
              className="px-4 py-1.5 bg-green-700 text-white rounded-lg text-xs font-semibold hover:bg-green-800">
              Add Item
            </button>
            <button onClick={() => { setShowForm(false); setForm(EMPTY_CAT_ITEM); }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Item list */}
      {filtered.length === 0 ? (
        <div className="py-6 text-center text-sm text-gray-400">
          {catalogue.length === 0
            ? 'No catalogue items yet. Add products above.'
            : 'No results for your search.'}
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto space-y-1">
          {filtered.map(item => (
            <div key={item.id}
              className="flex items-center gap-3 bg-white border border-gray-100 rounded-lg px-3 py-2 text-xs hover:border-gray-200">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={
                    item.priority === '★★★' ? 'text-red-500'
                    : item.priority === '★★' ? 'text-amber-500'
                    : 'text-gray-300'
                  }>
                    {item.priority || '★'}
                  </span>
                  <span className="font-medium text-gray-800 truncate">{item.name}</span>
                  {item.unit && <span className="text-gray-400 flex-shrink-0">· {item.unit}</span>}
                </div>
                {item.section && <p className="text-gray-400 mt-0.5">{item.section}</p>}
              </div>
              {canManage && (
                <button
                  onClick={() => onDelete(supplierName, item.id)}
                  className="text-red-400 hover:text-red-600 flex-shrink-0 text-xs px-2 py-1 rounded hover:bg-red-50"
                >
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
