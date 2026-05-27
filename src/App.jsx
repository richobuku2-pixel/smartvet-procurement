import { useEffect, useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import NotificationBanner from './components/NotificationBanner';
import ProductFinder from './components/ProductFinder';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Orders from './pages/Orders';
import Approvals from './pages/Approvals';
import SupplierAccounts from './pages/SupplierAccounts';
import Reports from './pages/Reports';
import Suppliers from './pages/Suppliers';
import UserManagement from './pages/UserManagement';
import Network from './pages/Network';
import MarketIntelligence from './pages/MarketIntelligence';
import PricingAdvisory from './pages/PricingAdvisory';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function AppContent() {
  const { activeTab, dispatch } = useApp();
  const { currentUser } = useAuth();
  const [showFinder, setShowFinder] = useState(false);

  // Sync role from logged-in user into AppContext
  useEffect(() => {
    if (currentUser?.role) {
      dispatch({ type: 'SET_ROLE', payload: currentUser.role });
    }
  }, [currentUser?.role, dispatch]);

  const PAGE = {
    dashboard: <Dashboard />,
    inventory: <Inventory />,
    orders: <Orders />,
    approvals: <Approvals />,
    suppliers: <Suppliers />,
    'supplier-accounts':   <SupplierAccounts />,
    'market-intelligence': <MarketIntelligence />,
    'pricing-advisory':    <PricingAdvisory />,
    reports: <Reports />,
    users: <UserManagement />,
    network: <Network />,
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto relative">
          {PAGE[activeTab] || <Dashboard />}
          {/* Floating product search button */}
          <button
            onClick={() => setShowFinder(true)}
            className="fixed bottom-6 right-6 z-40 bg-green-700 hover:bg-green-800 text-white rounded-full shadow-xl px-4 py-3 font-semibold text-sm flex items-center gap-2 transition-colors"
            title="Find a product across all supplier catalogues"
          >
            <span>🔍</span>
            <span className="hidden sm:inline">Find Product</span>
          </button>
        </main>
      </div>
      <NotificationBanner />
      {showFinder && <ProductFinder onClose={() => setShowFinder(false)} />}
    </div>
  );
}

function AuthGate() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 to-teal-800 flex items-center justify-center">
        <div className="text-center text-white">
          <img src="/logo.png" alt="SmartVet" className="w-20 h-20 mx-auto mb-4 animate-pulse" />
          <p className="text-green-200 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return <Login />;

  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
