/**
 * network/LocationCard.jsx
 *
 * Card component showing a single location's key stats:
 *   - total units in stock, SKU count, in-transit transfers
 *   - contact info and last restock date
 *   - edit / delete actions for admins
 *
 * Props:
 *   location        {Object}   — location record from AppContext
 *   transferOrders  {Array}    — all transfer orders (for pending/restock lookups)
 *   stockData       {Object}   — {productId: qty} map for this location
 *   isAdmin         {boolean}  — whether to show edit/delete actions
 *   onEdit          {Function} — called with location when edit is clicked
 *   onDelete        {Function} — called with location when delete is clicked
 */

import { formatDate } from '../../utils/formatter';

function typeBadge(type) {
  const map = {
    warehouse: 'bg-blue-100 text-blue-700 border border-blue-200',
    store:     'bg-emerald-100 text-emerald-700 border border-emerald-200',
    clinic:    'bg-purple-100 text-purple-700 border border-purple-200',
    depot:     'bg-amber-100 text-amber-700 border border-amber-200',
  };
  return map[type] || 'bg-gray-100 text-gray-600 border border-gray-200';
}

export default function LocationCard({ location, transferOrders, stockData, isAdmin, onEdit, onDelete }) {
  const skuCount  = Object.keys(stockData).filter(k => (stockData[k] || 0) > 0).length;
  const totalItems = Object.values(stockData).reduce((s, v) => s + (v || 0), 0);

  const recentTransfer = location.isMain
    ? null
    : [...transferOrders]
        .filter(t => t.toLocationId === location.id && t.status === 'received')
        .sort((a, b) => new Date(b.receivedAt || b.updatedAt) - new Date(a.receivedAt || a.updatedAt))[0];

  const pendingCount = location.isMain
    ? 0
    : transferOrders.filter(
        t => t.toLocationId === location.id && !['received', 'rejected'].includes(t.status)
      ).length;

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col ${
        location.isMain
          ? 'border-teal-200 ring-1 ring-teal-100'
          : 'border-gray-200'
      }`}
    >
      {/* Card header */}
      <div
        className={`px-4 py-3 flex items-start justify-between gap-2 ${
          location.isMain ? 'bg-gradient-to-r from-teal-50 to-green-50' : 'bg-gray-50'
        }`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 text-sm truncate">{location.name}</h3>
            {location.isMain && (
              <span className="text-xs bg-teal-600 text-white px-1.5 py-0.5 rounded font-medium">Main</span>
            )}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium capitalize ${typeBadge(location.type)}`}>
              {location.type}
            </span>
            {location.active === false && (
              <span className="text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">Inactive</span>
            )}
          </div>
          {location.address && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{location.address}</p>
          )}
        </div>
        {isAdmin && !location.isMain && (
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={() => onEdit(location)}
              className="text-gray-400 hover:text-blue-600 text-sm leading-none p-1"
              title="Edit"
            >
              ✏️
            </button>
            <button
              onClick={() => onDelete(location)}
              className="text-gray-400 hover:text-red-500 text-sm leading-none p-1"
              title="Remove"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="px-4 py-3 flex gap-3 text-center">
        <div className="flex-1">
          <p className="text-2xl font-bold text-gray-800">{totalItems.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Total Units</p>
        </div>
        <div className="w-px bg-gray-100" />
        <div className="flex-1">
          <p className="text-2xl font-bold text-gray-800">{skuCount}</p>
          <p className="text-xs text-gray-500">SKUs Stocked</p>
        </div>
        {pendingCount > 0 && (
          <>
            <div className="w-px bg-gray-100" />
            <div className="flex-1">
              <p className="text-2xl font-bold text-amber-500">{pendingCount}</p>
              <p className="text-xs text-gray-500">In Transit</p>
            </div>
          </>
        )}
      </div>

      {/* Contact / last restock */}
      <div className="px-4 py-2 border-t border-gray-100 space-y-0.5 mt-auto">
        {location.contactPerson && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span>👤</span>
            <span className="truncate">{location.contactPerson}</span>
          </div>
        )}
        {location.contactPhone && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span>📞</span>
            <span>{location.contactPhone}</span>
          </div>
        )}
        {!location.isMain && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
            <span>🕒</span>
            <span>
              {recentTransfer
                ? `Last restocked: ${formatDate(recentTransfer.receivedAt || recentTransfer.updatedAt)}`
                : 'No restocks yet'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
