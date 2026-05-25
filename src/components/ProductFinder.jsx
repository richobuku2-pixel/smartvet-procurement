import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { timeAgo } from '../utils/formatter';

const STATUS_CHIP = {
  in_stock:     'bg-green-100 text-green-800',
  low_stock:    'bg-amber-100 text-amber-800',
  out_of_stock: 'bg-red-100 text-red-700',
};
const STATUS_LABEL = {
  in_stock:     'In stock',
  low_stock:    'Low stock',
  out_of_stock: 'Out of stock',
};

function PriorityStars({ p }) {
  if (!p) return null;
  const color = p.includes('★★★') ? 'text-red-500' : p.includes('★★') ? 'text-amber-500' : 'text-gray-300';
  return <span className={`text-xs font-bold ${color}`}>{p}</span>;
}

// ── main modal ────────────────────────────────────────────────────────────────
export default function ProductFinder({ onClose }) {
  const { suppliers, availabilityLog, priceLog, dispatch } = useApp();
  const { currentUser } = useAuth();
  const [query, setQuery] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // Latest price per supplier-product (supplier → catalogueId → { price, date, source })
  const latestPricesBySupplier = useMemo(() => {
    const map = {}; // supplier → catalogueId → { price, date, source }
    for (const entry of (priceLog || [])) {
      if (!map[entry.supplier]) map[entry.supplier] = {};
      for (const item of (entry.items || [])) {
        const existing = map[entry.supplier][item.catalogueId];
        if (!existing || new Date(entry.date) > new Date(existing.date)) {
          map[entry.supplier][item.catalogueId] = {
            price: item.unitPrice,
            date: entry.date,
            source: entry.source,
          };
        }
      }
    }
    return map;
  }, [priceLog]);

  // Latest availability status per supplier-product
  const latestAvailability = useMemo(() => {
    const map = {}; // key: `${supplier}::${productId}` → { status, date }
    for (const entry of availabilityLog) {
      for (const chk of (entry.checks || [])) {
        const key = `${entry.supplier}::${chk.productId}`;
        if (!map[key] || new Date(entry.date) > new Date(map[key].date)) {
          map[key] = { status: chk.status, date: entry.date };
        }
      }
    }
    return map;
  }, [availabilityLog]);

  // Cross-supplier search
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return {};
    const grouped = {};
    Object.entries(suppliers).forEach(([supplierName, details]) => {
      (details.catalogue || []).forEach(item => {
        const hit =
          item.name.toLowerCase().includes(q) ||
          (item.indication || '').toLowerCase().includes(q) ||
          (item.spec || '').toLowerCase().includes(q) ||
          (item.section || '').toLowerCase().includes(q);
        if (hit) {
          if (!grouped[supplierName]) grouped[supplierName] = { details, items: [] };
          grouped[supplierName].items.push(item);
        }
      });
    });
    return grouped;
  }, [query, suppliers]);

  const supplierNames = Object.keys(results);
  const totalHits = supplierNames.reduce((s, n) => s + results[n].items.length, 0);

  const handleOrder = useCallback((supplierName) => {
    dispatch({ type: 'SET_MODAL', key: 'productFinderOrder', value: { supplierName } });
    dispatch({ type: 'SET_TAB', payload: 'orders' });
    onClose();
  }, [dispatch, onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-16">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <span className="text-xl">🔍</span>
          <div className="flex-1">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search any product across all supplier catalogues…"
              className="w-full text-base font-medium text-gray-900 placeholder-gray-400 outline-none bg-transparent"
            />
            {query.length >= 2 && (
              <p className="text-xs text-gray-400 mt-0.5">
                {totalHits} match{totalHits !== 1 ? 'es' : ''} across {supplierNames.length} supplier{supplierNames.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-lg leading-none">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {query.length < 2 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="text-4xl mb-3">🧬</div>
              <p className="font-semibold text-gray-700 text-sm">Search across all supplier catalogues</p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm">
                Type a product name, active ingredient, or indication (e.g. "Newcastle", "Piperazine", "Coccidiosis")
              </p>
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                {['Newcastle', 'Glucovit', 'Ivermectin', 'Enrofloxacin', 'Gumboro', 'Piperazine'].map(s => (
                  <button key={s} onClick={() => setQuery(s)}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-teal-50 hover:text-teal-700 rounded-full font-medium text-gray-600 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : supplierNames.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="text-3xl mb-2">🤷</div>
              <p className="font-semibold text-gray-600 text-sm">No products matched "{query}"</p>
              <p className="text-xs text-gray-400 mt-1">Try a different name, active ingredient, or indication</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {supplierNames.map(supplierName => {
                const { details, items } = results[supplierName];
                const isExpanded = selectedSupplier === supplierName || supplierNames.length === 1;
                // Last availability entry for this supplier
                const lastEntry = availabilityLog
                  .filter(e => e.supplier === supplierName)
                  .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

                return (
                  <div key={supplierName} className="bg-white">
                    {/* Supplier header row */}
                    <div
                      className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setSelectedSupplier(isExpanded && supplierNames.length > 1 ? null : supplierName)}
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-700 to-teal-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                        {supplierName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm">{supplierName}</p>
                        <p className="text-xs text-gray-400">
                          {items.length} matching product{items.length !== 1 ? 's' : ''}
                          {details.leadTimeDays ? ` · ${details.leadTimeDays}d lead time` : ''}
                          {lastEntry ? ` · checked ${timeAgo(lastEntry.date)}` : ' · never checked'}
                        </p>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); handleOrder(supplierName); }}
                        className="flex-shrink-0 px-3 py-1.5 bg-green-700 text-white text-xs font-semibold rounded-lg hover:bg-green-800 transition-colors"
                      >
                        Order →
                      </button>
                      <span className="text-gray-300 text-xs ml-1">{isExpanded ? '▲' : '▼'}</span>
                    </div>

                    {/* Product rows */}
                    {isExpanded && (
                      <div className="bg-gray-50 divide-y divide-gray-100 border-t border-gray-100">
                        {items.map(item => {
                          const avKey = `${supplierName}::${item.id}`;
                          const av = latestAvailability[avKey];
                          const priceInfo = (latestPricesBySupplier[supplierName] || {})[item.id];
                          return (
                            <div key={item.id} className="px-5 py-3 flex items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-semibold text-gray-800 leading-tight">{item.name}</p>
                                  <PriorityStars p={item.priority} />
                                </div>
                                {item.spec && <p className="text-xs text-gray-500 mt-0.5 truncate">{item.spec}</p>}
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  {item.section && (
                                    <span className="inline-block text-[10px] bg-white border border-gray-200 text-gray-500 rounded-full px-2 py-0.5">
                                      {item.section}
                                    </span>
                                  )}
                                  {item.unit && (
                                    <span className="inline-block text-[10px] bg-blue-50 text-blue-600 rounded-full px-2 py-0.5 border border-blue-100">
                                      {item.unit}
                                    </span>
                                  )}
                                  {av && (
                                    <span className={`inline-block text-[10px] rounded-full px-2 py-0.5 font-semibold ${STATUS_CHIP[av.status]}`}>
                                      {STATUS_LABEL[av.status]} · {timeAgo(av.date)}
                                    </span>
                                  )}
                                  {priceInfo && (
                                    <span className="inline-block text-[10px] bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 font-semibold">
                                      UGX {priceInfo.price.toLocaleString()} · {timeAgo(priceInfo.date)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Searching {Object.values(suppliers).reduce((s, d) => s + (d.catalogue?.length || 0), 0)} products across {Object.keys(suppliers).length} suppliers
          </p>
          <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600">Close</button>
        </div>
      </div>
    </div>
  );
}
