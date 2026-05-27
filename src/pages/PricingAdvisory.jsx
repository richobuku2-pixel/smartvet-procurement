/**
 * PricingAdvisory — Markup calculator & market benchmarking
 *
 * Shows ALL products from supplier catalogues, enriched with:
 *  • Cost price from priceLog (or manual entry)
 *  • Inventory quantity (cross-referenced via name matching)
 *  • Procurement history (from orders)
 *
 * Priority order (products sorted by):
 *   1. 🟢 In Stock  — currently held in main warehouse inventory
 *   2. 🔵 Procured  — has appeared in a confirmed/delivered order
 *   3. 🟡 Priced    — has a logged supplier price but not in stock/orders
 *   4. ⚪ Catalogue — catalogue only, no price or stock data yet
 */

import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, timeAgo } from '../utils/formatter';
import { MARKUP_TIERS } from '../constants';
import { PRODUCTS } from '../data/seedData';

// ── Market benchmark data (Uganda vet market research 2024–25) ────────────────
const MARKET_BENCHMARKS = {
  'ncd 1000ds':      { low: 9_500,  high: 12_000 },
  'ncd 500ds':       { low: 7_500,  high: 9_500  },
  'ncd+ib 1000ds':   { low: 14_000, high: 18_000 },
  'ncd+ib 500ds':    { low: 8_000,  high: 11_000 },
  'gumboro 1000ds':  { low: 30_000, high: 38_000 },
  'gumboro 500ds':   { low: 15_000, high: 20_000 },
  'fowl pox 1000ds': { low: 28_000, high: 36_000 },
  'fowl pox 500ds':  { low: 14_000, high: 19_000 },
};

function findBenchmark(name) {
  const nl = name.toLowerCase();
  for (const [key, val] of Object.entries(MARKET_BENCHMARKS)) {
    if (nl.includes(key) || key.includes(nl)) return val;
  }
  return null;
}

// ── Loose name similarity for bridging catalogue ↔ inventory ─────────────────
// Returns true when two product names share enough meaningful words.
function namesSimilar(a, b) {
  const words = s => s.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(w => w.length > 2);
  const wa = words(a), wb = words(b);
  const shared = wa.filter(w => wb.some(bw => bw.includes(w) || w.includes(bw)));
  return shared.length >= 1 && (shared.length / Math.min(wa.length, wb.length)) >= 0.4;
}

// ── Priority metadata ─────────────────────────────────────────────────────────
const PRIORITY_META = {
  in_stock:  { label: 'In Stock',  emoji: '🟢', badge: 'bg-green-100 text-green-700', order: 0 },
  procured:  { label: 'Procured',  emoji: '🔵', badge: 'bg-blue-100  text-blue-700',  order: 1 },
  priced:    { label: 'Priced',    emoji: '🟡', badge: 'bg-amber-100 text-amber-700', order: 2 },
  catalogue: { label: 'Catalogue', emoji: '⚪', badge: 'bg-gray-100  text-gray-500',  order: 3 },
};

// ── Small reusable components ─────────────────────────────────────────────────
function PctInput({ label, value, onChange, color }) {
  const cls = {
    blue:  'border-blue-300  focus:ring-blue-400  text-blue-700  bg-blue-50',
    teal:  'border-teal-300  focus:ring-teal-400  text-teal-700  bg-teal-50',
    green: 'border-green-300 focus:ring-green-400 text-green-700 bg-green-50',
  }[color] || '';
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      <div className="flex items-center gap-1">
        <input type="number" min="0" max="300" value={value}
          onChange={e => onChange(Number(e.target.value))}
          className={`w-16 text-sm font-bold border rounded-lg px-2 py-1.5 text-right outline-none focus:ring-2 ${cls}`} />
        <span className="text-sm text-gray-500 font-semibold">%</span>
      </div>
    </div>
  );
}

function PriorityBadge({ priority }) {
  const m = PRIORITY_META[priority] || PRIORITY_META.catalogue;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${m.badge}`}>
      {m.emoji} {m.label}
    </span>
  );
}

function MarginBadge({ margin }) {
  const cls = margin >= 40 ? 'bg-green-100 text-green-700'
    : margin >= 25 ? 'bg-teal-100 text-teal-700'
    : margin >= 15 ? 'bg-amber-100 text-amber-700'
    : 'bg-red-100 text-red-600';
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cls}`}>
      {margin.toFixed(0)}% margin
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PricingAdvisory() {
  const { suppliers, priceLog, orders, inventory, products } = useApp();

  const [markups, setMarkups] = useState({
    wholesale: MARKUP_TIERS.wholesale.pct,
    standard:  MARKUP_TIERS.standard.pct,
    retail:    MARKUP_TIERS.retail.pct,
  });

  // Manual cost overrides for items not yet in priceLog
  const [customCosts, setCustomCosts] = useState({});

  const [filterPriority, setFilterPriority] = useState('all');
  const [filterSupplier, setFilterSupplier]  = useState('all');
  const [sortBy, setSortBy]                  = useState('priority');
  const [activeTab, setActiveTab]            = useState('calculator');
  const [search, setSearch]                  = useState('');

  // ── Build enriched product list from ALL catalogues ────────────────────────
  const enrichedProducts = useMemo(() => {
    // 1. Build latest price lookup: "supplier||catalogueId" → { price, date, source }
    const latestPrice = {};
    for (const entry of (priceLog || [])) {
      for (const item of (entry.items || [])) {
        const k = `${entry.supplier}||${item.catalogueId}`;
        if (!latestPrice[k] || new Date(entry.date) > new Date(latestPrice[k].date)) {
          latestPrice[k] = { price: item.unitPrice, date: entry.date, source: entry.source };
        }
      }
    }

    // 2. Set of productNames that have appeared in any non-draft order
    const procuredSet = new Set();
    for (const order of (orders || [])) {
      if (order.status === 'draft' || order.status === 'cancelled') continue;
      for (const item of (order.items || [])) {
        if (item.productName) procuredSet.add(item.productName.toLowerCase());
      }
    }

    // 3. Inventory map: productId → qty (using PRODUCTS for numeric IDs)
    const allProducts = products?.length ? products : PRODUCTS;
    const invQtyMap = {}; // productId → qty
    for (const p of allProducts) {
      const qty = (inventory || {})[p.id] || 0;
      if (qty > 0) invQtyMap[p.id] = { qty, productName: p.name, supplier: p.supplier, landedCost: p.landedCost };
    }

    // 4. Walk every catalogue item across all suppliers
    const rows = [];
    const seen = new Set();

    for (const [supplierName, details] of Object.entries(suppliers || {})) {
      for (const item of (details.catalogue || [])) {
        const key = `${supplierName}||${item.id}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const priceEntry = latestPrice[key];

        // Check inventory: match by supplier + name similarity
        let inventoryQty = 0;
        let inventoryCost = null;
        for (const inv of Object.values(invQtyMap)) {
          if (inv.supplier === supplierName && namesSimilar(inv.productName, item.name)) {
            inventoryQty = Math.max(inventoryQty, inv.qty);
            if (inv.landedCost && !inventoryCost) inventoryCost = inv.landedCost;
          }
        }

        // Check procurement: name similarity against procured order items
        const itemNameLower = item.name.toLowerCase();
        const isProcured = [...procuredSet].some(pn => namesSimilar(pn, item.name));

        // Effective cost: logged price > inventory landedCost > null
        const loggedCost = priceEntry?.price ?? null;
        const effectiveCost = loggedCost ?? inventoryCost;

        // Priority
        const priority = inventoryQty > 0 ? 'in_stock'
          : isProcured                    ? 'procured'
          : effectiveCost                 ? 'priced'
          :                                 'catalogue';

        rows.push({
          key,
          supplier:     supplierName,
          catalogueId:  item.id,
          productName:  item.name,
          unit:         item.unit || '',
          section:      item.section || '',
          cost:         effectiveCost,
          loggedCost,
          date:         priceEntry?.date ?? null,
          source:       priceEntry?.source ?? null,
          inventoryQty,
          isProcured,
          priority,
        });
      }
    }

    // Also add inventory products NOT found in any catalogue (seed products with stock)
    for (const inv of Object.values(invQtyMap)) {
      const alreadyCovered = rows.some(r =>
        r.supplier === inv.supplier && namesSimilar(r.productName, inv.productName)
      );
      if (!alreadyCovered) {
        const key = `${inv.supplier}||inv-${inv.productName}`;
        rows.push({
          key,
          supplier:     inv.supplier,
          catalogueId:  null,
          productName:  inv.productName,
          unit:         '',
          section:      '',
          cost:         inv.landedCost || null,
          loggedCost:   null,
          date:         null,
          source:       'inventory',
          inventoryQty: inv.qty,
          isProcured:   true,
          priority:     'in_stock',
        });
      }
    }

    return rows;
  }, [suppliers, priceLog, orders, inventory, products]);

  // ── Derived counts for summary cards ──────────────────────────────────────
  const counts = useMemo(() => ({
    in_stock:  enrichedProducts.filter(r => r.priority === 'in_stock').length,
    procured:  enrichedProducts.filter(r => r.priority === 'procured').length,
    priced:    enrichedProducts.filter(r => r.priority === 'priced').length,
    catalogue: enrichedProducts.filter(r => r.priority === 'catalogue').length,
    total:     enrichedProducts.length,
  }), [enrichedProducts]);

  const supplierNames = useMemo(() => [...new Set(enrichedProducts.map(r => r.supplier))].sort(), [enrichedProducts]);

  // ── Filter + sort ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let rows = enrichedProducts;
    if (filterPriority !== 'all') rows = rows.filter(r => r.priority === filterPriority);
    if (filterSupplier !== 'all') rows = rows.filter(r => r.supplier === filterSupplier);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(r => r.productName.toLowerCase().includes(q) || r.supplier.toLowerCase().includes(q));
    }

    const PRIORITY_ORDER = { in_stock: 0, procured: 1, priced: 2, catalogue: 3 };
    return [...rows].sort((a, b) => {
      if (sortBy === 'priority') {
        const pd = (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
        if (pd !== 0) return pd;
        return a.productName.localeCompare(b.productName);
      }
      if (sortBy === 'cost') return (b.cost ?? 0) - (a.cost ?? 0);
      if (sortBy === 'name')  return a.productName.localeCompare(b.productName);
      return a.supplier.localeCompare(b.supplier);
    });
  }, [enrichedProducts, filterPriority, filterSupplier, search, sortBy]);

  const grossMarginPct = (cost, markupPct) =>
    ((markupPct / (100 + markupPct)) * 100);

  const effectiveCost = row => customCosts[row.key] !== undefined
    ? (customCosts[row.key] || null)
    : row.cost;

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Pricing Advisory</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            All {counts.total} catalogue products · markup calculator · Uganda market benchmarks
          </p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[['calculator','🧮 Calculator'],['methodology','📖 Methodology']].map(([t,l]) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${activeTab === t ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'calculator' ? (
        <>
          {/* Priority summary cards */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { key: 'in_stock',  label: 'In Stock',  icon: '🟢', bg: 'bg-green-50 border-green-200', text: 'text-green-700' },
              { key: 'procured',  label: 'Procured',  icon: '🔵', bg: 'bg-blue-50  border-blue-200',  text: 'text-blue-700'  },
              { key: 'priced',    label: 'Priced',    icon: '🟡', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
              { key: 'catalogue', label: 'Catalogue', icon: '⚪', bg: 'bg-gray-50  border-gray-200',  text: 'text-gray-600'  },
            ].map(({ key, label, icon, bg, text }) => (
              <button key={key} onClick={() => setFilterPriority(filterPriority === key ? 'all' : key)}
                className={`rounded-xl border shadow-sm px-4 py-3 text-left transition-all ${bg} ${filterPriority === key ? 'ring-2 ring-offset-1 ring-teal-400' : ''}`}>
                <p className={`text-xs font-semibold uppercase tracking-wide ${text}`}>{icon} {label}</p>
                <p className={`text-3xl font-black mt-0.5 ${text}`}>{counts[key]}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {key === 'in_stock'  ? 'In warehouse now'       :
                   key === 'procured'  ? 'On confirmed orders'    :
                   key === 'priced'    ? 'Logged cost price'       :
                                        'No price data yet'}
                </p>
              </button>
            ))}
          </div>

          {/* Markup controls */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm font-bold text-gray-800 mb-0.5">Markup Percentages</p>
                <p className="text-xs text-gray-400">Defaults are Uganda market benchmarks. Adjust to your strategy.</p>
              </div>
              <div className="flex items-end gap-5 flex-wrap">
                <PctInput label="Wholesale" value={markups.wholesale} color="blue"
                  onChange={v => setMarkups(p => ({ ...p, wholesale: v }))} />
                <PctInput label="Standard"  value={markups.standard}  color="teal"
                  onChange={v => setMarkups(p => ({ ...p, standard: v }))} />
                <PctInput label="Retail"    value={markups.retail}    color="green"
                  onChange={v => setMarkups(p => ({ ...p, retail: v }))} />
                <button onClick={() => setMarkups({ wholesale: 25, standard: 35, retail: 45 })}
                  className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 pb-2">
                  Reset defaults
                </button>
              </div>
            </div>
            {/* Gross margin strip */}
            <div className="flex gap-3 flex-wrap mt-4 pt-4 border-t border-gray-100">
              {[
                { label: 'Wholesale gross margin', pct: markups.wholesale, color: 'blue'  },
                { label: 'Standard gross margin',  pct: markups.standard,  color: 'teal'  },
                { label: 'Retail gross margin',    pct: markups.retail,    color: 'green' },
              ].map(({ label, pct, color }) => {
                const gm = grossMarginPct(null, pct).toFixed(1);
                const cls = color === 'blue'  ? 'bg-blue-50  border-blue-200  text-blue-700'
                  : color === 'teal'  ? 'bg-teal-50  border-teal-200  text-teal-700'
                  :                     'bg-green-50 border-green-200 text-green-700';
                return (
                  <div key={label} className={`flex-1 min-w-36 border rounded-xl px-4 py-3 ${cls}`}>
                    <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{label}</p>
                    <p className="text-2xl font-black mt-0.5">{gm}%</p>
                    <p className="text-[10px] opacity-60 mt-0.5">+{pct}% on cost → {gm}% gross margin</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filters + search */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-shrink-0">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search products…"
                className="pl-7 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs w-44 focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
            <select value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="all">All Suppliers</option>
              {supplierNames.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 ml-auto">
              {[['priority','Priority'],['cost','By Cost'],['name','By Name'],['supplier','By Supplier']].map(([k,l]) => (
                <button key={k} onClick={() => setSortBy(k)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${sortBy === k ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {filtered.length === 0 ? (
              <div className="p-16 text-center">
                <p className="text-4xl mb-3">💡</p>
                <p className="text-gray-500 font-semibold">
                  {enrichedProducts.length === 0
                    ? 'No supplier catalogues yet'
                    : 'No products match your filters'}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  {enrichedProducts.length === 0
                    ? 'Add products to your supplier catalogues via Suppliers → Catalogue'
                    : 'Try clearing the priority or supplier filter'}
                </p>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 sticky top-0">
                    <th className="px-4 py-3 text-left text-gray-500 font-semibold">Product</th>
                    <th className="px-4 py-3 text-left text-gray-400 font-semibold hidden lg:table-cell">Supplier</th>
                    <th className="px-4 py-3 text-left text-gray-400 font-semibold">Status</th>
                    <th className="px-4 py-3 text-right text-gray-500 font-semibold">
                      Cost Price
                      <span className="block text-[9px] font-normal text-gray-400 normal-case">editable if unlogged</span>
                    </th>
                    <th className="px-4 py-3 text-right text-blue-500 font-semibold">
                      Wholesale
                      <span className="block text-[9px] font-normal text-blue-300">+{markups.wholesale}%</span>
                    </th>
                    <th className="px-4 py-3 text-right text-teal-600 font-semibold">
                      Standard
                      <span className="block text-[9px] font-normal text-teal-300">+{markups.standard}%</span>
                    </th>
                    <th className="px-4 py-3 text-right text-green-600 font-semibold">
                      Retail
                      <span className="block text-[9px] font-normal text-green-300">+{markups.retail}%</span>
                    </th>
                    <th className="px-4 py-3 text-center text-gray-400 font-semibold hidden xl:table-cell">vs Market</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(row => {
                    const cost = effectiveCost(row);
                    const wholesale = cost ? Math.round(cost * (1 + markups.wholesale / 100)) : null;
                    const standard  = cost ? Math.round(cost * (1 + markups.standard  / 100)) : null;
                    const retail    = cost ? Math.round(cost * (1 + markups.retail    / 100)) : null;
                    const bench     = findBenchmark(row.productName);
                    const gmRetail  = grossMarginPct(cost, markups.retail);
                    const isCustom  = customCosts[row.key] !== undefined;

                    let vsMarket = null;
                    if (bench && retail) {
                      const mid  = (bench.low + bench.high) / 2;
                      const diff = ((retail - mid) / mid) * 100;
                      vsMarket = { diff, ok: Math.abs(diff) <= 10 };
                    }

                    return (
                      <tr key={row.key} className={`hover:bg-gray-50 transition-colors ${row.priority === 'in_stock' ? 'bg-green-50/30' : row.priority === 'procured' ? 'bg-blue-50/20' : ''}`}>

                        {/* Product name + section + stock qty */}
                        <td className="px-4 py-2.5">
                          <p className="font-semibold text-gray-800 leading-tight">{row.productName}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {row.section && <span className="text-[10px] text-gray-400">{row.section}</span>}
                            {row.inventoryQty > 0 && (
                              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                                {row.inventoryQty} in stock
                              </span>
                            )}
                            {row.date && (
                              <span className="text-[10px] text-gray-300">{timeAgo(row.date)}</span>
                            )}
                          </div>
                        </td>

                        {/* Supplier */}
                        <td className="px-4 py-2.5 text-gray-400 hidden lg:table-cell whitespace-nowrap">{row.supplier}</td>

                        {/* Priority badge */}
                        <td className="px-4 py-2.5">
                          <PriorityBadge priority={row.priority} />
                        </td>

                        {/* Cost price — editable for unlogged products */}
                        <td className="px-4 py-2.5 text-right">
                          {row.loggedCost ? (
                            <div className="flex flex-col items-end">
                              <span className="font-mono font-bold text-gray-700">{formatCurrency(row.loggedCost)}</span>
                              <span className="text-[9px] text-gray-300 capitalize">{row.source || 'logged'}</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              {isCustom && (
                                <button onClick={() => setCustomCosts(p => { const n = {...p}; delete n[row.key]; return n; })}
                                  className="text-[9px] text-gray-300 hover:text-red-400">✕</button>
                              )}
                              <input
                                type="number"
                                value={customCosts[row.key] ?? ''}
                                onChange={e => setCustomCosts(p => ({ ...p, [row.key]: e.target.value ? Number(e.target.value) : '' }))}
                                placeholder="Enter cost"
                                className="w-24 text-right text-xs border border-dashed border-gray-300 rounded-md px-2 py-1 outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-200 font-mono placeholder:text-gray-300"
                              />
                            </div>
                          )}
                        </td>

                        {/* Wholesale */}
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-blue-600">
                          {wholesale ? formatCurrency(wholesale) : <span className="text-gray-200 font-normal">—</span>}
                        </td>

                        {/* Standard */}
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-teal-600">
                          {standard ? formatCurrency(standard) : <span className="text-gray-200 font-normal">—</span>}
                        </td>

                        {/* Retail + margin badge */}
                        <td className="px-4 py-2.5 text-right">
                          {retail ? (
                            <div className="flex flex-col items-end gap-0.5">
                              <span className="font-mono font-bold text-green-600">{formatCurrency(retail)}</span>
                              <MarginBadge margin={gmRetail} />
                            </div>
                          ) : <span className="text-gray-200">—</span>}
                        </td>

                        {/* vs Market */}
                        <td className="px-4 py-2.5 text-center hidden xl:table-cell">
                          {vsMarket ? (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              vsMarket.ok ? 'bg-green-50 text-green-600'
                              : vsMarket.diff > 0 ? 'bg-red-50 text-red-500'
                              : 'bg-amber-50 text-amber-600'
                            }`}>
                              {vsMarket.diff > 0 ? '▲' : '▼'}{Math.abs(vsMarket.diff).toFixed(0)}%
                              {vsMarket.ok ? ' ✓' : vsMarket.diff > 0 ? ' high' : ' low'}
                            </span>
                          ) : <span className="text-[10px] text-gray-300">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Table footer */}
            {filtered.length > 0 && (
              <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <p className="text-[11px] text-gray-400">
                  Showing {filtered.length} of {enrichedProducts.length} products
                  {filterPriority !== 'all' || filterSupplier !== 'all' ? ' (filtered)' : ''}
                </p>
                <p className="text-[11px] text-gray-400">
                  💡 Products without a logged cost show an editable field — enter a cost to see suggested prices
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        /* ── Methodology tab ── */
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-gray-800 mb-3">Uganda Veterinary Market — Pricing Structure</h3>
            <div className="space-y-3">
              {[
                { from: 'Manufacturer / Importer', to: 'Distributor (e.g. Eram Uganda)', markup: '20–35%', note: 'Volume-based; varies by product registration and exclusivity' },
                { from: 'Distributor', to: 'Wholesale Vet Shop / SmartVet', markup: '25–40%', note: 'Your purchase (cost) price sits at this level' },
                { from: 'SmartVet → Wholesale', to: 'Vet Clinics / Bulk buyers', markup: '+25%', note: 'Recommended SmartVet wholesale tier' },
                { from: 'SmartVet → Retail', to: 'Farmers / End users', markup: '+45%', note: 'Recommended SmartVet retail tier' },
              ].map((tier, i) => (
                <div key={i} className="flex items-start gap-4 bg-gray-50 rounded-xl p-4">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center">{i + 1}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-gray-700">{tier.from}</span>
                      <span className="text-gray-400 text-xs">→</span>
                      <span className="text-xs font-semibold text-gray-700">{tier.to}</span>
                      <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">{tier.markup}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">{tier.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-3">Recommended Defaults</h3>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(MARKUP_TIERS).map(([key, tier]) => (
                <div key={key} className="border rounded-xl p-4 space-y-1">
                  <p className="text-xs font-bold text-gray-700">{tier.label}</p>
                  <p className="text-2xl font-black text-teal-600">+{tier.pct}%</p>
                  <p className="text-[11px] text-gray-400">{tier.description}</p>
                  <p className="text-[10px] text-gray-300">→ {grossMarginPct(null, tier.pct).toFixed(1)}% gross margin</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs font-bold text-amber-700 mb-1">⚠️ Market Data Caveat</p>
            <p className="text-xs text-amber-600 leading-relaxed">
              Market benchmarks are estimates from Uganda vet market research (2024–25). Prices vary by
              region, season, and disease outbreak pressure — vaccines can rise 15–40% during outbreaks.
              Log supplier prices regularly via <strong>Suppliers → Log Prices</strong> for the most accurate advisory.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
