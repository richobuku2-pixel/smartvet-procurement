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

export const SEED_PASSWORD = 'smartvet2026';
