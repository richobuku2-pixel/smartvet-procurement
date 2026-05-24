export const formatCurrency = (amount) =>
  `UGX ${Number(amount || 0).toLocaleString('en-UG')}`;

export const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const formatDaysAgo = (iso) => {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return `${diff} days ago`;
};

export const addDays = (iso, days) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

export const daysUntil = (iso) => {
  if (!iso) return null;
  return Math.ceil((new Date(iso) - Date.now()) / 86400000);
};

export const generateOrderId = (existingOrders = []) => {
  const year = new Date().getFullYear();
  const seq = existingOrders.filter(o => o.orderId?.includes(String(year))).length + 1;
  return `PO-${year}-${String(seq).padStart(3, '0')}`;
};

export const generateTransferOrderId = (existingTransfers = []) => {
  const year = new Date().getFullYear();
  const seq = existingTransfers.filter(t => t.orderId?.includes(String(year))).length + 1;
  return `TO-${year}-${String(seq).padStart(3, '0')}`;
};
