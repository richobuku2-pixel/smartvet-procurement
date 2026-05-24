const PREFIX = 'smartvet:';

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage write failed:', e);
      return false;
    }
  },
  remove(key) {
    localStorage.removeItem(PREFIX + key);
  },
  exportAll() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith(PREFIX)) {
        try { data[k.slice(PREFIX.length)] = JSON.parse(localStorage.getItem(k)); } catch {}
      }
    }
    return data;
  },
  importAll(data) {
    Object.entries(data).forEach(([k, v]) => this.set(k, v));
  },
};
