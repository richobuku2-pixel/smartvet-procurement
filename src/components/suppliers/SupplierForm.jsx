/**
 * SupplierForm
 *
 * Controlled form for creating or editing a supplier record.
 *
 * Props:
 *   initial   — existing supplier { name, details } (for edit mode)
 *   isNew     — boolean; if true shows a blank form, name field is editable
 *   onSubmit  — fn(name: string, details: object)
 *   onCancel  — fn()
 */
import { useState } from 'react';
import { PAYMENT_TERMS } from '../../constants';

const EMPTY_FORM = {
  name:                 '',
  contactEmail:         '',
  contactPerson:        '',
  phone:                '',
  location:             '',
  paymentTerms:         'Net 30',
  minimumOrderQuantity: 1,
  leadTimeDays:         7,
  notes:                '',
};

export default function SupplierForm({ initial, isNew, onSubmit, onCancel }) {
  const [form, setForm] = useState(
    isNew ? EMPTY_FORM : {
      name:                 initial?.name || '',
      contactEmail:         initial?.details?.contactEmail || '',
      contactPerson:        initial?.details?.contactPerson || '',
      phone:                initial?.details?.phone || '',
      location:             initial?.details?.location || '',
      paymentTerms:         initial?.details?.paymentTerms || 'Net 30',
      minimumOrderQuantity: initial?.details?.minimumOrderQuantity ?? 1,
      leadTimeDays:         initial?.details?.leadTimeDays ?? 7,
      notes:                initial?.details?.notes || '',
    }
  );
  const [error, setError] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim())           { setError('Supplier name is required.');                 return; }
    if (!form.contactEmail.trim())   { setError('Contact email is required.');                 return; }
    if (form.minimumOrderQuantity < 1) { setError('Minimum order quantity must be at least 1.'); return; }
    if (form.leadTimeDays < 1)       { setError('Lead time must be at least 1 day.');          return; }
    setError('');
    const { name, ...details } = form;
    onSubmit(name.trim(), {
      contactEmail:         details.contactEmail.trim(),
      contactPerson:        details.contactPerson.trim(),
      phone:                details.phone.trim(),
      location:             details.location.trim(),
      paymentTerms:         details.paymentTerms,
      minimumOrderQuantity: Number(details.minimumOrderQuantity),
      leadTimeDays:         Number(details.leadTimeDays),
      notes:                details.notes.trim(),
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
            <p className="text-xs text-amber-600 mt-1">
              ⚠️ Supplier name cannot be changed (products are linked by name).
            </p>
          )}
        </div>

        {/* Contact Email */}
        <div>
          <label className={labelClass}>Contact Email *</label>
          <input type="email" value={form.contactEmail}
            onChange={e => set('contactEmail', e.target.value)}
            placeholder="orders@supplier.ug" className={fieldClass} required />
        </div>

        {/* Contact Person */}
        <div>
          <label className={labelClass}>Contact Person</label>
          <input type="text" value={form.contactPerson}
            onChange={e => set('contactPerson', e.target.value)}
            placeholder="Sales Manager" className={fieldClass} />
        </div>

        {/* Phone */}
        <div>
          <label className={labelClass}>Phone Number</label>
          <input type="tel" value={form.phone}
            onChange={e => set('phone', e.target.value)}
            placeholder="+256 700 000000" className={fieldClass} />
        </div>

        {/* Location */}
        <div>
          <label className={labelClass}>Location</label>
          <input type="text" value={form.location}
            onChange={e => set('location', e.target.value)}
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
