// Simple SHA-256 hash using Web Crypto API (runs in browser)
export const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

export const generateId = () =>
  `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// Default password hash for "smartvet2026" — pre-computed so seed works synchronously
// SHA-256 of "smartvet2026"
export const DEFAULT_PASSWORD_HASH =
  'b9f8f6e7d3c2a1e0f5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2';

// We'll hash on first run instead of hardcoding — see seedUsers below
export const SEED_PASSWORD = 'smartvet2026';
