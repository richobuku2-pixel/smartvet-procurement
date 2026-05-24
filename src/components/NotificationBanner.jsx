import { useApp } from '../context/AppContext';

const VARIANT_STYLES = {
  success: 'bg-green-50 border-green-400 text-green-800',
  error: 'bg-red-50 border-red-400 text-red-800',
  warning: 'bg-amber-50 border-amber-400 text-amber-800',
  info: 'bg-teal-50 border-teal-400 text-teal-800',
};

export default function NotificationBanner() {
  const { notifications, dispatch } = useApp();
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {notifications.map(n => (
        <div
          key={n.id}
          className={`flex items-start gap-3 p-3 rounded-lg border shadow-md text-sm ${VARIANT_STYLES[n.variant] || VARIANT_STYLES.info}`}
        >
          <span className="flex-1">{n.message}</span>
          <button
            onClick={() => dispatch({ type: 'REMOVE_NOTIFICATION', payload: n.id })}
            className="text-current opacity-60 hover:opacity-100 leading-none mt-0.5"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
