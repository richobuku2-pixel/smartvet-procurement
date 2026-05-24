import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ROLES, SEED_PASSWORD } from '../data/seedData';
import { formatDate } from '../utils/formatter';

const ROLE_COLORS = {
  admin: 'bg-green-900 text-green-50',
  procurement_manager: 'bg-teal-700 text-white',
  accounts_manager: 'bg-green-700 text-white',
  inventory_manager: 'bg-teal-100 text-teal-800',
};

function UserForm({ initial, onSubmit, onCancel, isNew }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    email: initial?.email || '',
    role: initial?.role || 'inventory_manager',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required.'); return; }
    if (!form.email.trim()) { setError('Email is required.'); return; }
    if (isNew && !form.password) { setError('Password is required for new users.'); return; }
    if (form.password && form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password && form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setSaving(true);
    try {
      await onSubmit({ ...form, id: initial?.id });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Full Name *</label>
          <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="Jane Nakato" required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email *</label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
            placeholder="jane@smartvet.ug" required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Role *</label>
          <select value={form.role} onChange={e => set('role', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            {Object.entries(ROLES).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
            {isNew ? 'Password *' : 'New Password (optional)'}
          </label>
          <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
            placeholder={isNew ? 'Min. 8 characters' : 'Leave blank to keep current'}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        {form.password && (
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Confirm Password *</label>
            <input type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)}
              placeholder="Re-enter password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
        )}
      </div>

      {/* Role permissions preview */}
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Permissions for {ROLES[form.role]?.label}</p>
        <div className="flex flex-wrap gap-1.5">
          {(ROLES[form.role]?.permissions || []).map(p => (
            <span key={p} className="px-2 py-0.5 bg-white border border-gray-200 rounded-full text-xs text-gray-600">{p.replace(/_/g, ' ')}</span>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={saving}
          className="flex-1 py-2.5 bg-green-700 text-white rounded-lg text-sm font-semibold hover:bg-green-800 disabled:opacity-60 transition-colors">
          {saving ? 'Saving...' : isNew ? 'Create User' : 'Save Changes'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function UserManagement() {
  const { users, currentUser, createUser, updateUser, deleteUser } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const [success, setSuccess] = useState('');

  const isAdmin = currentUser?.role === 'admin';

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    ROLES[u.role]?.label.toLowerCase().includes(search.toLowerCase())
  );

  const notify = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const handleCreate = async (data) => {
    await createUser(data);
    setShowForm(false);
    notify('User created successfully.');
  };

  const handleUpdate = async (data) => {
    await updateUser(data);
    setEditingUser(null);
    notify('User updated successfully.');
  };

  const handleDelete = async (user) => {
    try {
      deleteUser(user.id);
      setDeleteConfirm(null);
      notify(`${user.name} has been removed.`);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">User Management</h2>
          <p className="text-sm text-gray-500">{users.length} user{users.length !== 1 ? 's' : ''} · Manage access and roles</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setShowForm(true); setEditingUser(null); }}
            className="px-4 py-2.5 bg-green-700 text-white rounded-lg text-sm font-semibold hover:bg-green-800 flex items-center gap-2">
            + Add User
          </button>
        )}
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">{success}</div>
      )}

      {/* Create / Edit form */}
      {(showForm || editingUser) && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-4">
            {editingUser ? `Edit — ${editingUser.name}` : 'Create New User'}
          </h3>
          <UserForm
            initial={editingUser}
            isNew={!editingUser}
            onSubmit={editingUser ? handleUpdate : handleCreate}
            onCancel={() => { setShowForm(false); setEditingUser(null); }}
          />
        </div>
      )}

      {/* Search */}
      <input type="text" placeholder="Search by name, email or role..."
        value={search} onChange={e => setSearch(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-green-500" />

      {/* Users table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500 uppercase font-medium tracking-wider">
              <th className="px-5 py-3 text-left">User</th>
              <th className="px-5 py-3 text-left">Role</th>
              <th className="px-5 py-3 text-left">Auth</th>
              <th className="px-5 py-3 text-left">Joined</th>
              {isAdmin && <th className="px-5 py-3 text-left">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(user => (
              <tr key={user.id} className={`hover:bg-gray-50/50 ${user.id === currentUser?.id ? 'bg-green-50/30' : ''}`}>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    {user.picture ? (
                      <img src={user.picture} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-600 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-800">
                        {user.name}
                        {user.id === currentUser?.id && <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-normal">You</span>}
                      </p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-700'}`}>
                    {ROLES[user.role]?.label || user.role}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-1.5">
                    {user.passwordHash && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">🔑 Password</span>}
                    {user.googleLinked && <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">🌐 Google</span>}
                  </div>
                </td>
                <td className="px-5 py-4 text-xs text-gray-400">{formatDate(user.createdAt)}</td>
                {isAdmin && (
                  <td className="px-5 py-4">
                    <div className="flex gap-3">
                      <button onClick={() => { setEditingUser(user); setShowForm(false); }}
                        className="text-xs text-teal-700 hover:underline font-medium">Edit</button>
                      {user.id !== currentUser?.id && (
                        <button onClick={() => setDeleteConfirm(user)}
                          className="text-xs text-red-500 hover:underline">Remove</button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="p-10 text-center text-gray-400 text-sm">No users found.</div>
        )}
      </div>

      {/* Delete confirm dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900">Remove User</h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to remove <strong>{deleteConfirm.name}</strong>? They will lose access immediately.
            </p>
            <div className="mt-5 flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
