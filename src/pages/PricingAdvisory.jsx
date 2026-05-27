/**
 * PricingAdvisory — Markup calculator & market benchmarking
 *
 * Uses logged purchase prices to suggest:
 *   • Wholesale prices  (default +25% — for vet clinics / bulk buyers)
 *   • Standard prices   (default +35% — internal benchmark)
 *   • Retail prices     (default +45% — direct to farmers)
 *
 * Market context: Uganda veterinary supply chain benchmarks based on
 * EazyAgric, AgriShop, and regional vet distributor data.
 */

import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, timeAgo } from '../utils/formatter';
import { MARKUP_TIERS } from '../constants';

// ── Market benchmark data (EazyAgric / Uganda vet market research) ────────────
// These are approximate retail market prices in UGX for cross-reference.
// Update periodically as market prices shift.
const MARKET_BENCHMARKS = {
  'NCD 1000DS':      { low: 9_500,  high: 12_000, source: 'Uganda vet market avg' },
  'NCD 500DS':       { low: 7_500,  high: 9_500,  source: 'Uganda vet market avg' },
  'NCD+IB 1000DS':   { low: 14_000, high: 18_000, source: 'Uganda vet market avg' },
  'NCD+IB 500DS':    { low: 8_000,  high: 11_000, source: 'Uganda vet market avg' },
  'GUMBORO 1000DS':  { low: 30_000, high: 38_000, source: 'Uganda vet market avg' },
  'GUMBORO 500DS':   { low: 15_000, high: 20_000, source: 'Uganda vet market avg' },
  'FOWL POX 1000DS': { low: 28_000, high: 36_000, source: 'Uganda vet market avg' },
  'FOWL POX 500DS':  { low: 14_000, high: 19_000, source: 'Uganda vet market avg' },
};

function findBenchmark(productName) {
  const nl = productName.toLowerCase();
  for (const [key, val] of Object.entries(MARKET_BENCHMARKS)) {
    if (nl.includes(key.toLowerCase()) || key.toLowerCase().includes(nl)) return val;
  }
  return null;
}

// ── Small helper components ───────────────────────────────────────────────────
function PctInput({ label, value, onChange, color }) {
  const colors = {
    blue:  'border-blue-300  focus:ring-blue-400  text-blue-700  bg-blue-50',
    teal:  'border-teal-300  focus:ring-teal-400  text-teal-700  bg-teal-50',
    green: 'border-green-300 focus:ring-green-400 text-green-700 bg-green-50',
  };
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      <div className="flex items-center gap-1">
        <input
          type="number" min="0" max="300" value={value}
          onChange={e => onChange(Number(e.target.value))}
          className={`w-16 text-sm font-bold border rounded-lg px-2 py-1.5 text-right outline-none focus:ring-2 ${colors[color] || colors.teal}`}
        />
        <span className="text-sm text-gray-500 font-semibold">%</span>
      </div>
    </div>
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

function BenchmarkBar({ cost, suggested, benchLow, benchHigh }) {
  if (!benchLow) return null;
  const max = Math.max(benchHigh * 1.15, suggested * 1.1);
  const pct = v => Math.min(100, Math.round((v / max) * 100));
  return (
    <div className="mt-1.5">
      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
        {/* Market range */}
        <div
          className="absolute h-full bg-blue-100 rounded-full"
          style={{ left: `${pct(benchLow)}%`, width: `${pct(benchHigh) - pct(benchLow)}%` }}
        />
        {/* Our suggested price marker */}
        <div
          className="absolute h-full w-0.5 bg-teal-500 rounded-full"
          style={{ left: `${pct(suggested)}%` }}
        />
        {/* Purchase cost marker */}
        <div
          className="absolute h-full w-0.5 bg-gray-400 rounded-full"
          style={{ left: `${pct(cost)}%` }}
        />
      </div>
      <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
        <span>Cost: {formatCurrency(cost)}</span>
        <span className="text-blue-500">Market: {formatCurrency(benchLow)}–{formatCurrency(benchHigh)}</span>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PricingAdvisory() {
  const { suppliers, priceLog } = useApp();

  // Markup % state — starts from research-backed defaults
  const [markups, setMarkups] = useState({
    wholesale: MARKUP_TIERS.wholesale.pct,
    standard:  MARKUP_TIERS.standard.pct,
    retail:    MARKUP_TIERS.retail.pct,
  });

  const [filterSupplier, setFilterSupplier] = useState('all');
  const [sortBy, setSortBy] = useState('supplier'); // 'supplier' | 'margin' | 'price'
  const [activeTab, setActiveTab] = useState('calculator'); // 'calculator' | 'methodology'

  // Build latest cost price per supplier+product from priceLog
  const costData = useMemo(() => {
    const map = {}; // key: `${supplier}||${catalogueId}` → { supplier, catalogueId, productName, cost, date, source }
    for (const entry of (priceLog || [])) {
      for (const item of (entry.items || [])) {
        const key = `${entry.supplier}||${item.catalogueId}`;
        const ex = map[key];
        if (!ex || new Date(entry.date) > new Date(ex.date)) {
          map[key] = {
            supplier:    entry.supplier,
            catalogueId: item.catalogueId,
            productName: item.productName,
            cost:        item.unitPrice,
            date:        entry.date,
            source:      entry.source,
          };
        }
      }
    }
    return Object.values(map);
  }, [priceLog]);

  const supplierNames = useMemo(() => [...new Set(costData.map(d => d.supplier))].sort(), [costData]);

  const filtered = useMemo(() => {
    let rows = filterSupplier === 'all' ? costData : costData.filter(d => d.supplier === filterSupplier);
    if (sortBy === 'price')  rows = [...rows].sort((a, b) => b.cost - a.cost);
    if (sortBy === 'margin') rows = [...rows].sort((a, b) => {
      const mA = ((a.cost * (1 + markups.retail / 100) - a.cost) / (a.cost * (1 + markups.retail / 100))) * 100;
      const mB = ((b.cost * (1 + markups.retail / 100) - b.cost) / (b.cost * (1 + markups.retail / 100))) * 100;
      return mB - mA;
    });
    if (sortBy === 'supplier') rows = [...rows].sort((a, b) => a.supplier.localeCompare(b.supplier) || a.productName.localeCompare(b.productName));
    return rows;
  }, [costData, filterSupplier, sortBy, markups]);

  const grossMargin = (cost, pct) => {
    const price = cost * (1 + pct / 100);
    return ((price - cost) / price) * 100;
  };

  const totalRows    = filtered.length;
  const avgWholesale = filtered.length ? Math.round(filtered.reduce((s, d) => s + d.cost * (1 + markups.wholesale / 100), 0) / filtered.length) : 0;
  const avgRetail    = filtered.length ? Math.round(filtered.reduce((s, d) => s + d.cost * (1 + markups.retail / 100), 0) / filtered.length) : 0;

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Pricing Advisory</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Mark-up calculator · retail &amp; wholesale pricing · Uganda market benchmarks
          </p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {['calculator', 'methodology'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${activeTab === t ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
              {t === 'calculator' ? '🧮 Calculator' : '📖 Methodology'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'calculator' ? (
        <>
          {/* Markup controls */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm font-bold text-gray-800 mb-0.5">Markup Percentages</p>
                <p className="text-xs text-gray-400">Adjust to match your pricing strategy. Defaults are Uganda market benchmarks.</p>
              </div>
              <div className="flex items-end gap-5 flex-wrap">
                <PctInput label="Wholesale" value={markups.wholesale} color="blue"
                  onChange={v => setMarkups(p => ({ ...p, wholesale: v }))} />
                <PctInput label="Standard" value={markups.standard} color="teal"
                  onChange={v => setMarkups(p => ({ ...p, standard: v }))} />
                <PctInput label="Retail" value={markups.retail} color="green"
                  onChange={v => setMarkups(p => ({ ...p, retail: v }))} />
                <button onClick={() => setMarkups({ wholesale: 25, standard: 35, retail: 45 })}
                  className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 pb-2">
                  Reset defaults
                </button>
              </div>
            </div>

            {/* Margin summary pills */}
            <div className="flex gap-3 flex-wrap mt-4 pt-4 border-t border-gray-100">
              {[
                { label: 'Wholesale gross margin', pct: markups.wholesale, color: 'blue' },
                { label: 'Standard gross margin',  pct: markups.standard,  color: 'teal' },
                { label: 'Retail gross margin',    pct: markups.retail,    color: 'green' },
              ].map(({ label, pct, color }) => {
                const gm = ((pct / (100 + pct)) * 100).toFixed(1);
                const cls = color === 'blue' ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : color === 'teal' ? 'bg-teal-50 border-teal-200 text-teal-700'
                  : 'bg-green-50 border-green-200 text-green-700';
                return (
                  <div key={label} className={`flex-1 min-w-40 border rounded-xl px-4 py-3 ${cls}`}>
                    <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{label}</p>
                    <p className="text-2xl font-black mt-0.5">{gm}%</p>
                    <p className="text-[10px] opacity-60 mt-0.5">+{pct}% on cost → {gm}% gross margin</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary strip */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
              <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Products Priced</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalRows}</p>
            </div>
            <div className="bg-blue-50 rounded-xl border border-blue-100 shadow-sm px-5 py-4">
              <p className="text-xs text-blue-500 uppercase font-semibold tracking-wide">Avg Wholesale Price</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">{formatCurrency(avgWholesale)}</p>
            </div>
            <div className="bg-green-50 rounded-xl border border-green-100 shadow-sm px-5 py-4">
              <p className="text-xs text-green-500 uppercase font-semibold tracking-wide">Avg Retail Price</p>
              <p className="text-2xl font-bold text-green-700 mt-1">{formatCurrency(avgRetail)}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <select value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="all">All Suppliers</option>
              {supplierNames.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {[['supplier','By Supplier'],['price','By Cost'],['margin','By Margin']].map(([k,l]) => (
                <button key={k} onClick={() => setSortBy(k)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${sortBy === k ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing table */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center">
              <p className="text-4xl mb-3">💰</p>
              <p className="text-gray-500 font-semibold">No price data yet</p>
              <p className="text-gray-400 text-sm mt-1">
                Log prices for your supplier products via <strong>Suppliers → Log Prices</strong>,
                then return here to see advisory pricing.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-gray-500 font-semibold">Product</th>
                    <th className="px-4 py-3 text-left text-gray-400 font-semibold hidden md:table-cell">Supplier</th>
                    <th className="px-4 py-3 text-right text-gray-500 font-semibold">Cost Price</th>
                    <th className="px-4 py-3 text-right text-blue-500 font-semibold">Wholesale<br/><span className="text-[10px] font-normal text-gray-400">+{markups.wholesale}%</span></th>
                    <th className="px-4 py-3 text-right text-teal-600 font-semibold">Standard<br/><span className="text-[10px] font-normal text-gray-400">+{markups.standard}%</span></th>
                    <th className="px-4 py-3 text-right text-green-600 font-semibold">Retail<br/><span className="text-[10px] font-normal text-gray-400">+{markups.retail}%</span></th>
                    <th className="px-4 py-3 text-center text-gray-400 font-semibold hidden lg:table-cell">vs Market</th>
                    <th className="px-4 py-3 text-right text-gray-400 font-semibold hidden md:table-cell">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((row, i) => {
                    const wholesale = Math.round(row.cost * (1 + markups.wholesale / 100));
                    const standard  = Math.round(row.cost * (1 + markups.standard  / 100));
                    const retail    = Math.round(row.cost * (1 + markups.retail    / 100));
                    const bench     = findBenchmark(row.productName);
                    const gmRetail  = grossMargin(row.cost, markups.retail);

                    // Compare our retail to market midpoint
                    let vsMarket = null;
                    if (bench) {
                      const mid = (bench.low + bench.high) / 2;
                      const diff = ((retail - mid) / mid) * 100;
                      vsMarket = { diff, label: diff > 5 ? 'Above market' : diff < -5 ? 'Below market' : 'At market' };
                    }

                    return (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-800">{row.productName}</p>
                          {bench && (
                            <BenchmarkBar cost={row.cost} suggested={retail} benchLow={bench.low} benchHigh={bench.high} />
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{row.supplier}</td>
                        <td className="px-4 py-3 text-right font-mono text-gray-700 font-semibold">
                          {formatCurrency(row.cost)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-blue-600">
                          {formatCurrency(wholesale)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-teal-600">
                          {formatCurrency(standard)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-green-600">
                          <div className="flex flex-col items-end gap-0.5">
                            <span>{formatCurrency(retail)}</span>
                            <MarginBadge margin={gmRetail} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center hidden lg:table-cell">
                          {vsMarket ? (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              vsMarket.diff > 5  ? 'bg-red-50 text-red-600'
                              : vsMarket.diff < -5 ? 'bg-amber-50 text-amber-600'
                              : 'bg-green-50 text-green-600'
                            }`}>
                              {vsMarket.diff > 0 ? '+' : ''}{vsMarket.diff.toFixed(0)}% {vsMarket.label}
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-400 hidden md:table-cell">
                          {timeAgo(row.date)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        /* Methodology tab */
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-gray-800 mb-3">Uganda Veterinary Market — Pricing Structure</h3>
            <div className="space-y-3">
              {[
                { from: 'Manufacturer / Importer', to: 'Distributor (e.g. Eram Uganda)', markup: '20–35%', note: 'Volume-based; varies by product registration and exclusivity' },
                { from: 'Distributor', to: 'Wholesale Vet Shop', markup: '25–40%', note: 'Your purchase price is at this level' },
                { from: 'Wholesale', to: 'Retail Vet Clinic', markup: '20–30%', note: 'SmartVet Wholesale tier' },
                { from: 'Retail Clinic', to: 'Farmer / End User', markup: '30–50%', note: 'SmartVet Retail tier' },
              ].map((tier, i) => (
                <div key={i} className="flex items-start gap-4 bg-gray-50 rounded-xl p-4">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-gray-700">{tier.from}</span>
                      <span className="text-gray-400 text-xs">→</span>
                      <span className="text-xs font-semibold text-gray-700">{tier.to}</span>
                      <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">+{tier.markup}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">{tier.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-3">Recommended Defaults for SmartVet</h3>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(MARKUP_TIERS).map(([key, tier]) => (
                <div key={key} className="border rounded-xl p-4 space-y-1">
                  <p className="text-xs font-bold text-gray-700">{tier.label}</p>
                  <p className="text-2xl font-black text-teal-600">+{tier.pct}%</p>
                  <p className="text-[11px] text-gray-400">{tier.description}</p>
                  <p className="text-[10px] text-gray-300">
                    → {((tier.pct / (100 + tier.pct)) * 100).toFixed(1)}% gross margin
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs font-bold text-amber-700 mb-2">⚠️ Market Benchmark Caveat</p>
            <p className="text-xs text-amber-600 leading-relaxed">
              Market benchmarks shown in the calculator are estimates based on Uganda veterinary market data
              (EazyAgric, AgriShop, regional vet distributor surveys, 2024–2025). Actual prices vary by
              region, season, and disease outbreak pressure. Vaccine prices rise 15–40% during outbreak
              periods (e.g. Newcastle Disease in dry season). Update your supplier prices regularly via
              <strong> Suppliers → Log Prices</strong> for the most accurate advisory.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
