/**
 * purchase-order/Step1SupplierSelect.jsx
 *
 * Step 1 of the Purchase Order Wizard — supplier selection grid.
 * Displays all available suppliers as cards with an editable contact-person
 * field for this specific PO call.
 *
 * Props:
 *   suppliers {Object}   — suppliersMap from AppContext
 *   onSelect  {Function} — called with (supplierName, supplierDetails, contactPerson)
 *                          when the user picks a supplier
 */

import { useState } from 'react';

export default function Step1SupplierSelect({ suppliers, onSelect }) {
  const [contactEdits, setContactEdits] = useState({});

  const list = Object.entries(suppliers || {});

  const getContact = (name, details) =>
    contactEdits[name] !== undefined ? contactEdits[name] : (details.contactPerson || '');

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-gray-900">Select Supplier</h3>
        <p className="text-sm text-gray-500 mt-0.5">Choose the supplier you're calling. Edit the contact person for this PO.</p>
      </div>

      {list.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">
          No suppliers found. Add suppliers from the Suppliers page first.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[55vh] overflow-y-auto pr-1">
        {list.map(([name, details]) => {
          const catCount = (details.catalogue || []).length;
          return (
            <div key={name}
              className="border border-gray-200 rounded-xl p-4 hover:border-red-300 hover:shadow-md transition-all cursor-pointer group bg-white"
            >
              {/* Supplier name + catalogue count */}
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-900 to-red-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {name.charAt(0)}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  catCount > 0 ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'
                }`}>
                  {catCount > 0 ? `${catCount} products` : 'No catalogue'}
                </span>
              </div>

              <p className="font-semibold text-gray-900 text-sm leading-tight mb-1">{name}</p>
              <p className="text-xs text-gray-400 mb-3">{details.contactEmail || '—'}</p>

              {/* Contact person — editable for this PO */}
              <div className="mb-3">
                <label className="block text-xs text-gray-400 mb-1">Contact person (this call)</label>
                <input
                  type="text"
                  value={getContact(name, details)}
                  onChange={e => setContactEdits(p => ({ ...p, [name]: e.target.value }))}
                  onClick={e => e.stopPropagation()}
                  placeholder={details.contactPerson || 'Enter name…'}
                  className="w-full text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
                />
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3 text-xs text-gray-500">
                {details.phone && <span>📞 {details.phone}</span>}
                {details.paymentTerms && <span>⏱ {details.paymentTerms}</span>}
              </div>

              <button
                onClick={() => onSelect(name, details, getContact(name, details))}
                className="w-full py-2 bg-red-900 hover:bg-red-800 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Select Supplier →
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
