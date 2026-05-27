/**
 * Suppliers page
 *
 * Displays supplier cards with availability / price freshness indicators,
 * quick inline log panels (check-in & price), and expandable detail tabs
 * (Details, Catalogue, Availability, Prices).
 *
 * Sub-components live in src/components/suppliers/:
 *   AvailabilityCheckinModal — full modal for paste / AI / manual check-in
 *   CatalogueManager         — catalogue CRUD panel (Details → Catalogue tab)
 *   SupplierForm             — create / edit supplier form
 *   QuickLogPanel            — fast inline check-in or price log
 */
import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { PRODUCTS } from '../data/seedData';
import CatalogueImportModal from '../components/CatalogueImportModal';
import PriceUpdateModal from '../components/PriceUpdateModal';
import AvailabilityCheckinModal from '../components/suppliers/AvailabilityCheckinModal';
import CatalogueManager from '../components/suppliers/CatalogueManager';
import SupplierForm from '../components/suppliers/SupplierForm';
import QuickLogPanel from '../components/suppliers/QuickLogPanel';
import { timeAgo } from '../utils/formatter';
import { calcAvailabilityScore, calcPriceTrend, calcProductRisk, RISK_META } from '../utils/marketIntelligence';

export default function Suppliers() {
  const {
    suppliers, products,
    addSupplier, updateSupplier, deleteSupplier,
    addCatalogueItem, deleteCatalogueItem,
    notify,
    availabilityLog, logAvailabilityCheck,
    priceLog, logPriceUpdate,
  } = useApp();
  const { currentUser } = useAuth();

  const [showForm, setShowForm]         = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null); // { name, details }
  const [deleteConfirm, setDeleteConfirm]     = useState(null);
  const [search, setSearch]             = useState('');
  const [expandedCards, setExpandedCards]     = useState({});
  const [activeTab, setActiveTab]       = useState({}); // { [supplierName]: 'details'|'catalogue'|'availability'|'prices' }
  const [importModal, setImportModal]   = useState({ open: false, supplierName: null });
  const [showCheckinModal, setShowCheckinModal] = useState(null); // supplierName | null
  const [showPriceModal, setShowPriceModal]     = useState(null); // supplierName | null
  const [quickPanel, setQuickPanel]     = useState(null); // { name, mode: 'checkin'|'price' } | null

  // ── Derived lookups ──────────────────────────────────────────────────────────

  // Last availability check-in date per supplier
  const lastCheckedBySupplier = useMemo(() => {
    const map = {};
    for (const entry of (availabilityLog || [])) {
      if (!map[entry.supplier] || new Date(entry.date) > new Date(map[entry.supplier])) {
        map[entry.supplier] = entry.date;
      }
    }
    return map;
  }, [availabilityLog]);

  // Latest price per supplier → catalogueId → { price, date, source }
  const latestPricesBySupplier = useMemo(() => {
    const sup = {};
    for (const entry of (priceLog || [])) {
      if (!sup[entry.supplier]) sup[entry.supplier] = {};
      for (const item of (entry.items || [])) {
        const ex = sup[entry.supplier][item.catalogueId];
        if (!ex || new Date(entry.date) > new Date(ex.date)) {
          sup[entry.supplier][item.catalogueId] = {
            price:  item.unitPrice,
            date:   entry.date,
            source: entry.source,
          };
        }
      }
    }
    return sup;
  }, [priceLog]);

  // Last price-logged date per supplier
  const lastPricedBySupplier = useMemo(() => {
    const map = {};
    for (const entry of (priceLog || [])) {
      if (!map[entry.supplier] || new Date(entry.date) > new Date(map[entry.supplier])) {
        map[entry.supplier] = entry.date;
      }
    }
    return map;
  }, [priceLog]);

  // Worst risk level per supplier (badge on card header)
  const riskBySupplier = useMemo(() => {
    const LEVEL_ORDER = { critical: 0, at_risk: 1, monitor: 2, stable: 3, unknown: 4 };
    const out = {};
    for (const [supplierName, details] of Object.entries(suppliers || {})) {
      const leadTime = Number(details.leadTimeDays) || 7;
      let worst = 'unknown';
      for (const item of (details.catalogue || [])) {
        const av = calcAvailabilityScore(availabilityLog, supplierName, item.id);
        const pt = calcPriceTrend(priceLog, supplierName, item.id);
        const { level } = calcProductRisk(av, pt, leadTime);
        if ((LEVEL_ORDER[level] ?? 4) < (LEVEL_ORDER[worst] ?? 4)) worst = level;
      }
      out[supplierName] = worst;
    }
    return out;
  }, [availabilityLog, priceLog, suppliers]);

  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'procurement_manager';

  // Count inventory products per supplier
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

  // ── Handlers ─────────────────────────────────────────────────────────────────

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

  const handleCatalogueImport = (supplierName, newItems, mode) => {
    const existing  = suppliers[supplierName]?.catalogue || [];
    const catalogue = mode === 'replace' ? newItems : [...existing, ...newItems];
    updateSupplier(supplierName, { catalogue });
    notify(
      `${newItems.length} product${newItems.length !== 1 ? 's' : ''} ${
        mode === 'replace' ? 'imported (catalogue replaced)' : 'added to catalogue'
      } for ${supplierName}.`,
      'success'
    );
  };

  const productCountForSupplier = (name) => productCounts[name] || 0;

  // ── Render ────────────────────────────────────────────────────────────────────
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
        {/* Stale check-ins card */}
        {(() => {
          const stale = Object.keys(suppliers || {}).filter(n => {
            const lc = lastCheckedBySupplier[n];
            if (!lc) return true;
            return (Date.now() - new Date(lc)) > 7 * 86400000;
          });
          return (
            <div className={`rounded-xl border shadow-sm px-5 py-4 ${
              stale.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'
            }`}>
              <p className={`text-xs font-medium uppercase tracking-wide ${
                stale.length > 0 ? 'text-amber-600' : 'text-green-600'
              }`}>
                Stock Check-ins
              </p>
              <p className={`text-2xl font-bold mt-1 ${stale.length > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                {stale.length}
                <span className="text-sm font-normal ml-1">{stale.length > 0 ? 'need check' : 'all current'}</span>
              </p>
              {stale.length > 0 && (
                <p className="text-[10px] text-amber-500 mt-0.5 truncate">
                  {stale.slice(0, 2).join(', ')}{stale.length > 2 ? ` +${stale.length - 2}` : ''}
                </p>
              )}
            </div>
          );
        })()}
      </div>

      {/* Add supplier form */}
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
          const isEditing   = editingSupplier?.name === name;
          const isExpanded  = expandedCards[name];
          const riskLevel   = riskBySupplier[name] || 'unknown';
          const riskMeta    = RISK_META[riskLevel];
          const isQuickOpen = quickPanel?.name === name;
          const quickMode   = quickPanel?.mode;
          const initials    = name.split(/\s+/).filter(w => w.length > 1).map(w => w[0]).join('').slice(0, 2).toUpperCase() || name.slice(0, 2).toUpperCase();
          const lc          = lastCheckedBySupplier[name];
          const lp          = lastPricedBySupplier[name];
          const catalogueLen = (details.catalogue || []).length;

          return (
            <div key={name} className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
              riskLevel === 'critical' ? 'border-red-200'
              : riskLevel === 'at_risk' ? 'border-orange-200'
              : 'border-gray-200'
            }`}>

              {/* ── Card header ──────────────────────────────────────────── */}
              <div className="px-5 pt-4 pb-3">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-700 to-teal-600 flex items-center justify-center text-white font-black text-base flex-shrink-0 shadow-sm">
                    {initials}
                  </div>

                  {/* Name block */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-gray-900 leading-tight">{name}</h3>
                      {riskLevel !== 'unknown' && (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${riskMeta.badge}`}>
                          {riskMeta.emoji} {riskMeta.label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {[details.location, details.contactEmail].filter(Boolean).join(' · ') || '—'}
                    </p>
                    {/* Meta chips */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="text-[11px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-medium">📋 {catalogueLen} items</span>
                      {details.minimumOrderQuantity && <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">MOQ {details.minimumOrderQuantity}</span>}
                      {details.leadTimeDays         && <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{details.leadTimeDays}d lead</span>}
                      {details.paymentTerms         && <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{details.paymentTerms}</span>}
                      {/* Stock check freshness */}
                      {lc ? (
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                          (Date.now()-new Date(lc))/86400000 <= 7 ? 'bg-green-50 text-green-700'
                          : (Date.now()-new Date(lc))/86400000 <= 30 ? 'bg-amber-50 text-amber-600'
                          : 'bg-red-50 text-red-500'
                        }`}>
                          ✓ stock {timeAgo(lc)}
                        </span>
                      ) : (
                        <span className="text-[11px] bg-red-50 text-red-400 px-2 py-0.5 rounded-full">⚠ never checked</span>
                      )}
                      {/* Price freshness */}
                      {lp ? (
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                          (Date.now()-new Date(lp))/86400000 <= 14 ? 'bg-green-50 text-green-700'
                          : (Date.now()-new Date(lp))/86400000 <= 60 ? 'bg-amber-50 text-amber-600'
                          : 'bg-red-50 text-red-500'
                        }`}>
                          💰 {timeAgo(lp)}
                        </span>
                      ) : (
                        <span className="text-[11px] bg-amber-50 text-amber-500 px-2 py-0.5 rounded-full">💰 no prices</span>
                      )}
                    </div>
                  </div>

                  {/* Admin actions */}
                  {canManage && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => {
                          setEditingSupplier({ name, details });
                          setShowForm(false);
                          setExpandedCards(p => ({ ...p, [name]: true }));
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500 hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(name)}
                        className="text-[11px] px-2.5 py-1 rounded-lg border border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50 font-medium"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Action row */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <button
                    onClick={() => setQuickPanel(isQuickOpen && quickMode === 'checkin' ? null : { name, mode: 'checkin' })}
                    className={`text-xs px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                      isQuickOpen && quickMode === 'checkin'
                        ? 'bg-teal-600 text-white'
                        : 'bg-teal-50 border border-teal-300 text-teal-700 hover:bg-teal-100'
                    }`}
                  >
                    📋 Check-in
                  </button>
                  <button
                    onClick={() => setQuickPanel(isQuickOpen && quickMode === 'price' ? null : { name, mode: 'price' })}
                    className={`text-xs px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                      isQuickOpen && quickMode === 'price'
                        ? 'bg-amber-500 text-white'
                        : 'bg-amber-50 border border-amber-300 text-amber-700 hover:bg-amber-100'
                    }`}
                  >
                    💰 Log Prices
                  </button>
                  <button
                    onClick={() => toggleExpand(name)}
                    className="text-xs px-3.5 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 font-medium ml-auto"
                  >
                    {isExpanded ? '▲ Less' : '▼ Details'}
                  </button>
                </div>
              </div>

              {/* ── Quick-log inline panel ──────────────────────────────── */}
              {isQuickOpen && (
                <QuickLogPanel
                  key={`${name}-${quickMode}`}
                  mode={quickMode}
                  supplierName={name}
                  catalogue={details.catalogue || []}
                  currentUser={currentUser}
                  latestPrices={latestPricesBySupplier[name] || {}}
                  onSave={quickMode === 'checkin' ? logAvailabilityCheck : logPriceUpdate}
                  onAdvanced={() => {
                    setQuickPanel(null);
                    if (quickMode === 'checkin') setShowCheckinModal(name);
                    else setShowPriceModal(name);
                  }}
                  onClose={() => setQuickPanel(null)}
                />
              )}

              {/* ── Expanded detail tabs ────────────────────────────────── */}
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
                        {['Details', 'Catalogue', 'Availability', 'Prices'].map(tab => {
                          const tabKey    = tab.toLowerCase();
                          const isActive  = (activeTab[name] || 'details') === tabKey;
                          const supplyLogs = (availabilityLog || []).filter(e => e.supplier === name);
                          const priceLogs  = (priceLog || []).filter(e => e.supplier === name);
                          return (
                            <button
                              key={tab}
                              onClick={() => setActiveTab(p => ({ ...p, [name]: tabKey }))}
                              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                                isActive
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
                              {tab === 'Availability' && supplyLogs.length > 0 && (
                                <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${
                                  isActive ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'
                                }`}>
                                  {supplyLogs.length}
                                </span>
                              )}
                              {tab === 'Prices' && priceLogs.length > 0 && (
                                <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${
                                  isActive ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                                }`}>
                                  {priceLogs.length}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Tab content */}
                      <div className="px-5 py-4">

                        {/* Details tab */}
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

                        {/* Catalogue tab */}
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

                        {/* Availability tab */}
                        {(activeTab[name] || 'details') === 'availability' && (() => {
                          const supplyLogs = (availabilityLog || [])
                            .filter(e => e.supplier === name)
                            .sort((a, b) => new Date(b.date) - new Date(a.date));
                          return (
                            <div className="space-y-3">
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
                                            {entry.source === 'paste' && <span className="text-[10px] bg-blue-50 text-blue-600 rounded-full px-1.5 py-0.5">paste</span>}
                                            {entry.source === 'url_scrape' && <span className="text-[10px] bg-purple-50 text-purple-600 rounded-full px-1.5 py-0.5">scrape</span>}
                                          </div>
                                          <span className="text-[10px] text-gray-400 flex-shrink-0">by {entry.checkedBy}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-[11px] flex-wrap">
                                          {inStock  > 0 && <span className="text-green-600 font-medium">✓ {inStock} in stock</span>}
                                          {lowStock > 0 && <span className="text-amber-500 font-medium">⚠ {lowStock} low</span>}
                                          {outStock > 0 && <span className="text-red-500 font-medium">✕ {outStock} out of stock</span>}
                                          {(entry.checks || []).length === 0 && <span className="text-gray-400">No products logged</span>}
                                        </div>
                                        {entry.notes && <p className="text-[10px] text-gray-400 mt-1 italic truncate">{entry.notes}</p>}
                                        {(entry.checks || []).filter(c => c.status !== 'in_stock').length > 0 && (
                                          <div className="flex flex-wrap gap-1 mt-1.5">
                                            {(entry.checks || []).filter(c => c.status !== 'in_stock').map(c => (
                                              <span key={c.productId} className={`text-[10px] rounded-full px-2 py-0.5 font-medium ${
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

                        {/* Prices tab */}
                        {(activeTab[name] || 'details') === 'prices' && (() => {
                          const supPriceLogs  = (priceLog || []).filter(e => e.supplier === name).sort((a, b) => new Date(b.date) - new Date(a.date));
                          const latestPrices  = latestPricesBySupplier[name] || {};
                          const catalogue     = details.catalogue || [];
                          const pricedItems   = catalogue.filter(i => latestPrices[i.id]);
                          return (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500">
                                  {supPriceLogs.length === 0
                                    ? 'No price updates logged yet.'
                                    : `${supPriceLogs.length} update${supPriceLogs.length !== 1 ? 's' : ''} · Last ${timeAgo(supPriceLogs[0].date)}`}
                                </p>
                                <button
                                  onClick={() => setShowPriceModal(name)}
                                  className="px-3 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 flex items-center gap-1.5"
                                >
                                  + Log Price Update
                                </button>
                              </div>

                              {/* Current price list table */}
                              {pricedItems.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Current Price List</p>
                                  <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
                                    <table className="w-full text-xs">
                                      <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                          <th className="px-3 py-2 text-left text-gray-500 font-semibold">Product</th>
                                          <th className="px-3 py-2 text-right text-gray-500 font-semibold">Unit Price</th>
                                          <th className="px-3 py-2 text-right text-gray-500 font-semibold">Updated</th>
                                          <th className="px-3 py-2 text-center text-gray-500 font-semibold">Source</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-50">
                                        {pricedItems.map(item => {
                                          const lp   = latestPrices[item.id];
                                          const prev = supPriceLogs.slice(1).flatMap(e => e.items || []).find(i => i.catalogueId === item.id);
                                          const pct  = prev ? Math.round(((lp.price - prev.unitPrice) / prev.unitPrice) * 100) : null;
                                          return (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                              <td className="px-3 py-2 text-gray-800 font-medium truncate max-w-[200px]">{item.name}</td>
                                              <td className="px-3 py-2 text-right font-mono font-bold text-gray-900">
                                                UGX {lp.price.toLocaleString()}
                                                {pct !== null && pct !== 0 && (
                                                  <span className={`ml-1.5 text-[10px] font-semibold ${pct > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                                    {pct > 0 ? '▲' : '▼'}{Math.abs(pct)}%
                                                  </span>
                                                )}
                                              </td>
                                              <td className="px-3 py-2 text-right text-gray-400">{timeAgo(lp.date)}</td>
                                              <td className="px-3 py-2 text-center">
                                                <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-medium ${
                                                  lp.source === 'paste'      ? 'bg-blue-50 text-blue-600'
                                                  : lp.source === 'file'     ? 'bg-purple-50 text-purple-600'
                                                  : lp.source === 'web_scrape' ? 'bg-teal-50 text-teal-600'
                                                  : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                  {lp.source === 'paste' ? 'paste' : lp.source === 'file' ? 'file' : lp.source === 'web_scrape' ? 'web' : 'phone'}
                                                </span>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}

                              {/* Price log history */}
                              {supPriceLogs.length === 0 ? (
                                <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                  <p className="text-3xl mb-2">💰</p>
                                  <p className="text-sm font-medium text-gray-500">No price updates logged</p>
                                  <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                                    Log prices from phone calls, WhatsApp, catalogues or web pages.
                                  </p>
                                  <button
                                    onClick={() => setShowPriceModal(name)}
                                    className="mt-3 px-4 py-2 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700"
                                  >
                                    Log First Price Update
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Price History</p>
                                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                                    {supPriceLogs.map(entry => (
                                      <div key={entry.id} className="bg-white border border-gray-100 rounded-lg px-3 py-2.5">
                                        <div className="flex items-center justify-between mb-1.5">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-semibold text-gray-800">
                                              {new Date(entry.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                            <span className="text-[10px] text-gray-400">{timeAgo(entry.date)}</span>
                                            <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-medium ${
                                              entry.source === 'paste'      ? 'bg-blue-50 text-blue-600'
                                              : entry.source === 'file'     ? 'bg-purple-50 text-purple-600'
                                              : entry.source === 'web_scrape' ? 'bg-teal-50 text-teal-600'
                                              : 'bg-gray-100 text-gray-500'
                                            }`}>
                                              {entry.source === 'paste' ? '💬 paste' : entry.source === 'file' ? '📎 file' : entry.source === 'web_scrape' ? '🌐 web' : '📞 phone'}
                                            </span>
                                          </div>
                                          <span className="text-[10px] text-gray-400">{(entry.items || []).length} prices · by {entry.recordedBy}</span>
                                        </div>
                                        {entry.notes && <p className="text-[10px] text-gray-400 italic mb-1">{entry.notes}</p>}
                                        <div className="flex flex-wrap gap-1">
                                          {(entry.items || []).slice(0, 5).map(item => (
                                            <span key={item.catalogueId} className="text-[10px] bg-amber-50 text-amber-700 rounded px-1.5 py-0.5 font-mono">
                                              {item.productName.split(' ').slice(0, 3).join(' ')} — UGX {item.unitPrice.toLocaleString()}
                                            </span>
                                          ))}
                                          {(entry.items || []).length > 5 && (
                                            <span className="text-[10px] text-gray-400">+{entry.items.length - 5} more</span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
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

      {/* ── Modals ──────────────────────────────────────────────────────────────── */}

      {showCheckinModal && (
        <AvailabilityCheckinModal
          supplierName={showCheckinModal}
          catalogue={(suppliers[showCheckinModal]?.catalogue) || []}
          currentUser={currentUser}
          onSave={logAvailabilityCheck}
          onClose={() => setShowCheckinModal(null)}
        />
      )}

      {showPriceModal && (
        <PriceUpdateModal
          supplierName={showPriceModal}
          catalogue={(suppliers[showPriceModal]?.catalogue) || []}
          currentUser={currentUser}
          latestPrices={latestPricesBySupplier[showPriceModal] || {}}
          onSave={logPriceUpdate}
          onClose={() => setShowPriceModal(null)}
        />
      )}

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

      <CatalogueImportModal
        isOpen={importModal.open}
        onClose={() => setImportModal({ open: false, supplierName: null })}
        supplierName={importModal.supplierName || ''}
        onImport={(items, mode) => {
          if (importModal.supplierName) handleCatalogueImport(importModal.supplierName, items, mode);
          setImportModal({ open: false, supplierName: null });
        }}
      />
    </div>
  );
}
