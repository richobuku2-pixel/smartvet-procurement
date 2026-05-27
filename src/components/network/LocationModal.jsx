/**
 * network/LocationModal.jsx
 *
 * Modal dialog for adding a new location or editing an existing one.
 * Validates that the location name is not empty.
 *
 * Props:
 *   initial {Object|null} — existing location to edit, or null to create a new one
 *   onClose {Function}    — closes the modal without saving
 *   onSave  {Function}    — called with the form data object when the user saves
 */

import { useState } from 'react';

const LOCATION_TYPES = ['store', 'clinic', 'depot', 'warehouse'];

export default function LocationModal({ initial = null, onClose, onSave }) {
  const [form, setForm] = useState({
    name:          initial?.name          || '',
    type:          initial?.type          || 'store',
    address:       initial?.address       || '',
    contactPerson: initial?.contactPerson || '',
    contactPhone:  initial?.contactPhone  || '',
    contactEmail:  initial?.contactEmail  || '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave(form);
  };

  const Field = ({ label, fieldKey, type = 'text', required = false }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={form[fieldKey]}
        onChange={e => setForm(f => ({ ...f, [fieldKey]: e.target.value }))}
        className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 ${
          errors[fieldKey] ? 'border-red-400' : 'border-gray-300'
        }`}
      />
      {errors[fieldKey] && <p className="text-xs text-red-500 mt-0.5">{errors[fieldKey]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">{initial ? 'Edit Location' : 'Add Location'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="p-6 space-y-4">
          <Field label="Location Name" fieldKey="name" required />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              {LOCATION_TYPES.map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>
          <Field label="Address" fieldKey="address" />
          <Field label="Contact Person" fieldKey="contactPerson" />
          <Field label="Contact Phone" fieldKey="contactPhone" type="tel" />
          <Field label="Contact Email" fieldKey="contactEmail" type="email" />
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            {initial ? 'Save Changes' : 'Add Location'}
          </button>
        </div>
      </div>
    </div>
  );
}
