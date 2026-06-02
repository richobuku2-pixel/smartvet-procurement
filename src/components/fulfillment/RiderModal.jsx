/**
 * RiderModal — Add or edit a delivery rider.
 */
import { useState } from 'react';
import { useApp } from '../../context/AppContext';

const VEHICLE_TYPES = ['motorcycle', 'bicycle', 'car', 'van'];
const ZONES = ['Kampala Central', 'Wakiso', 'Mukono', 'Jinja', 'Mbarara', 'Gulu', 'Other'];
const STATUSES = ['available', 'on_delivery', 'off_duty'];

export default function RiderModal({ rider, onClose }) {
  const { addRider, updateRider } = useApp();
  const isEdit = !!rider;

  const [form, setForm] = useState({
    name:        rider?.name        || '',
    phone:       rider?.phone       || '',
    vehicleType: rider?.vehicleType || 'motorcycle',
    vehicleReg:  rider?.vehicleReg  || '',
    zone:        rider?.zone        || 'Kampala Central',
    status:      rider?.status      || 'available',
  });
  const [error, setError] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Rider name is required.'); return; }
    if (!form.phone.trim()) { setError('Phone number is required.'); return; }
    setError('');
    if (isEdit) updateRider(rider.id, form);
    else addRider(form);
    onClose();
  };

  const fieldCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500';
  const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">{isEdit ? 'Edit Rider' : 'Add Rider'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">⚠️ {error}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>Full Name *</label>
              <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="e.g. Ssebuliba David" className={fieldCls} />
            </div>
            <div>
              <label className={labelCls}>Phone *</label>
              <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="+256 700 000000" className={fieldCls} />
            </div>
            <div>
              <label className={labelCls}>Vehicle Type</label>
              <select value={form.vehicleType} onChange={e => set('vehicleType', e.target.value)} className={fieldCls}>
                {VEHICLE_TYPES.map(v => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Vehicle Reg</label>
              <input type="text" value={form.vehicleReg} onChange={e => set('vehicleReg', e.target.value)}
                placeholder="e.g. UAX 123B" className={fieldCls} />
            </div>
            <div>
              <label className={labelCls}>Zone</label>
              <select value={form.zone} onChange={e => set('zone', e.target.value)} className={fieldCls}>
                {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
            {isEdit && (
              <div className="col-span-2">
                <label className={labelCls}>Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)} className={fieldCls}>
                  {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit"
              className="flex-1 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-bold transition-colors">
              {isEdit ? 'Save Changes' : 'Add Rider'}
            </button>
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
