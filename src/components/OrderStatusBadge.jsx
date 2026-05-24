import { ORDER_STATUSES } from '../data/seedData';

const COLOR_MAP = {
  neutral: 'bg-gray-100 text-gray-700',
  warning: 'bg-amber-100 text-amber-800',
  secondary: 'bg-teal-100 text-teal-800',
  success: 'bg-green-100 text-green-800',
  primary: 'bg-teal-100 text-teal-800',
  danger: 'bg-red-100 text-red-800',
};

export default function OrderStatusBadge({ status }) {
  const info = ORDER_STATUSES[status] || { label: status, color: 'neutral' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${COLOR_MAP[info.color]}`}>
      {info.label}
    </span>
  );
}
