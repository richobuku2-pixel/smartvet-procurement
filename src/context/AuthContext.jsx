import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storage } from '../utils/storage';
import { hashPassword, generateId, SEED_PASSWORD } from '../utils/auth';
import { ROLES } from '../data/seedData';

const AuthContext = createContext(null);

const SEED_USERS = [
  { id: 'user_admin', name: 'Admin User', email: 'richard@smartvet.africa', role: 'admin', createdAt: new Date().toISOString() },
  { id: 'user_proc', name: 'Procurement Manager', email: 'admin@smartvet.africa', role: 'procurement_manager', createdAt: new Date().toISOString() },
  { id: 'user_accts', name: 'Accounts Manager', email: 'accounts@smartvet.ug', role: 'accounts_manager', createdAt: new Date().toISOString() },
  { id: 'user_inv', name: 'Inventory Manager', email: 'inventory@smartvet.ug', role: 'inventory_manager', createdAt: new Date().toISOString() },
];

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  // Initialise users on first load
  useEffect(() => {
    const initUsers = async () => {
      let storedUsers = storage.get('users', null);
      if (!storedUsers || storedUsers.length === 0) {
        // Seed default users with hashed password
        const hash = await hashPassword(SEED_PASSWORD);
        const seeded = SEED_USERS.map(u => ({ ...u, passwordHash: hash }));
        storage.set('users', seeded);
        storedUsers = seeded;
      }
      setUsers(storedUsers);

      // Restore session
      const session = storage.get('session', null);
      if (session) {
        const user = storedUsers.find(u => u.id === session.userId);
        if (user) setCurrentUser(user);
      }
      setLoading(false);
    };
    initUsers();
  }, []);

  const persistUsers = useCallback((updated) => {
    setUsers(updated);
    storage.set('users', updated);
  }, []);

  // ── Email / password login ──────────────────────────────
  const loginWithEmail = useCallback(async (email, password) => {
    setAuthError('');
    const hash = await hashPassword(password);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === hash);
    if (!user) {
      setAuthError('Invalid email or password.');
      return false;
    }
    setCurrentUser(user);
    storage.set('session', { userId: user.id, loginAt: new Date().toISOString() });
    return true;
  }, [users]);

  // ── Google login ────────────────────────────────────────
  const loginWithGoogle = useCallback((googleUser) => {
    setAuthError('');
    const { email, name, picture } = googleUser;
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      // Auto-create account with inventory_manager role (admin can promote later)
      const newUser = {
        id: generateId(),
        name,
        email,
        picture,
        role: 'inventory_manager',
        googleLinked: true,
        createdAt: new Date().toISOString(),
        passwordHash: null,
      };
      const updated = [...users, newUser];
      persistUsers(updated);
      user = newUser;
    } else {
      // Update picture if changed
      if (picture && user.picture !== picture) {
        const updated = users.map(u => u.id === user.id ? { ...u, picture } : u);
        persistUsers(updated);
        user = { ...user, picture };
      }
    }
    setCurrentUser(user);
    storage.set('session', { userId: user.id, loginAt: new Date().toISOString() });
    return true;
  }, [users, persistUsers]);

  // ── Logout ──────────────────────────────────────────────
  const logout = useCallback(() => {
    setCurrentUser(null);
    storage.remove('session');
  }, []);

  // ── User CRUD (admin only) ──────────────────────────────
  const createUser = useCallback(async ({ name, email, role, password }) => {
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('A user with this email already exists.');
    }
    const hash = await hashPassword(password || SEED_PASSWORD);
    const newUser = { id: generateId(), name, email, role, passwordHash: hash, createdAt: new Date().toISOString() };
    persistUsers([...users, newUser]);
    return newUser;
  }, [users, persistUsers]);

  const updateUser = useCallback(async ({ id, name, email, role, password }) => {
    const updated = await Promise.all(users.map(async u => {
      if (u.id !== id) return u;
      const changes = { name, email, role };
      if (password) changes.passwordHash = await hashPassword(password);
      return { ...u, ...changes };
    }));
    persistUsers(updated);
    // Refresh currentUser if updating self
    if (currentUser?.id === id) {
      const refreshed = updated.find(u => u.id === id);
      setCurrentUser(refreshed);
    }
  }, [users, currentUser, persistUsers]);

  const deleteUser = useCallback((id) => {
    if (currentUser?.id === id) throw new Error("You can't delete your own account.");
    persistUsers(users.filter(u => u.id !== id));
  }, [users, currentUser, persistUsers]);

  const hasPermission = useCallback((perm) => {
    if (!currentUser) return false;
    return ROLES[currentUser.role]?.permissions.includes(perm) ?? false;
  }, [currentUser]);

  // ── Password reset ──────────────────────────────────────
  /** Generates a reset token, stores it locally, then emails the link via /api/send-reset */
  const requestPasswordReset = useCallback(async (email) => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) throw new Error('No account found with this email address.');

    // Generate a cryptographically random token
    const token = Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    const expiry = Date.now() + 3_600_000; // 1 hour

    // Persist token
    const tokens = storage.get('resetTokens', {});
    tokens[token] = { email: user.email, expiry };
    storage.set('resetTokens', tokens);

    // Build the link — works for both dev (localhost:5173) and production
    const base = import.meta.env.VITE_APP_URL?.replace(/\/$/, '') || window.location.origin;
    const resetLink = `${base}/?resetToken=${token}`;

    const res = await fetch('/api/send-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: user.email, name: user.name, resetLink }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.error || 'Failed to send reset email.');
    }
  }, [users]);

  /** Validates the reset token and sets the new password */
  const confirmPasswordReset = useCallback(async (token, newPassword) => {
    const tokens = storage.get('resetTokens', {});
    const record = tokens[token];
    if (!record) throw new Error('Reset link is invalid or has already been used.');
    if (Date.now() > record.expiry) throw new Error('Reset link has expired. Please request a new one.');

    const user = users.find(u => u.email.toLowerCase() === record.email.toLowerCase());
    if (!user) throw new Error('Account not found.');

    const hash = await hashPassword(newPassword);
    const updated = users.map(u => u.id === user.id ? { ...u, passwordHash: hash } : u);
    persistUsers(updated);

    // Consume the token so it can't be reused
    delete tokens[token];
    storage.set('resetTokens', tokens);
  }, [users, persistUsers]);

  return (
    <AuthContext.Provider value={{
      currentUser, users, loading, authError, setAuthError,
      loginWithEmail, loginWithGoogle, logout,
      createUser, updateUser, deleteUser,
      hasPermission,
      requestPasswordReset, confirmPasswordReset,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
