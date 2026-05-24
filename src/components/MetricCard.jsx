export default function MetricCard({ title, value, subtitle, color = 'primary', onClick }) {
  const COLOR_MAP = {
    primary: 'border-t-teal-600 text-teal-700',
    warning: 'border-t-amber-500 text-amber-700',
    secondary: 'border-t-teal-500 text-teal-700',
    danger: 'border-t-red-500 text-red-700',
    success: 'border-t-green-600 text-green-700',
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-100 border-t-4 ${COLOR_MAP[color]} p-5 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <p className={`text-3xl font-bold mt-1 ${COLOR_MAP[color]}`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}
