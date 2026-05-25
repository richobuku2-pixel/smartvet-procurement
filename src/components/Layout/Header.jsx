import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { ROLES } from '../../data/seedData';
import { useState } from 'react';
import logoUrl from '/logo.png';

function timeAgo(iso) {
  const mins = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Header() {
  const { currentUser, logout } = useAuth();
  const { stockCounts, dispatch } = useApp();
  const [showMenu, setShowMenu] = useState(false);
  const lastCount = stockCounts[0] ?? null;

  const initials = currentUser?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <header className="bg-gradient-to-r from-green-900 via-teal-800 to-green-800 text-white px-6 py-2.5 flex items-center justify-between shadow-lg border-b border-green-700">
      {/* Logo + Brand */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-md overflow-hidden flex-shrink-0">
          <img
            src={logoUrl}
            alt="SmartVet Africa"
            className="w-10 h-10 object-contain"
            onError={e => { e.target.style.display = 'none'; }}
          />
        </div>
        <div>
          <h1 className="font-black text-base leading-tight tracking-wide">SmartVet Africa</h1>
          <p className="text-green-200 text-xs font-medium tracking-widest uppercase">Procurement System</p>
        </div>
      </div>

      {/* Tagline */}
      <p className="hidden lg:block text-green-200 text-xs italic font-light">
        Animal Health meets Innovation
      </p>


      {/* User menu */}
      <div className="flex items-center gap-3 relative">
        {/* Role badge */}
        <span className="hidden sm:block text-xs bg-green-800/60 border border-green-600 px-2.5 py-1 rounded-full text-green-100">
          {ROLES[currentUser?.role]?.label || 'User'}
        </span>

        {/* Avatar dropdown */}
        <button
          onClick={() => setShowMenu(p => !p)}
          className="flex items-center gap-2 hover:bg-green-700/50 rounded-lg px-2 py-1 transition-colors"
        >
          {currentUser?.picture ? (
            <img src={currentUser.picture} alt={currentUser.name} className="w-8 h-8 rounded-full object-cover border-2 border-green-400" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-green-600 border-2 border-green-400 flex items-center justify-center text-xs font-bold">
              {initials}
            </div>
          )}
          <span className="hidden sm:block text-sm font-medium">{currentUser?.name?.split(' ')[0]}</span>
          <span className="text-green-300 text-xs">▾</span>
        </button>

        {/* Dropdown menu */}
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <p className="font-semibold text-gray-800 text-sm">{currentUser?.name}</p>
                <p className="text-xs text-gray-400">{currentUser?.email}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => { logout(); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium flex items-center gap-2"
                >
                  <span>🚪</span> Sign Out
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
