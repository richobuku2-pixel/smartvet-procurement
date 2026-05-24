import { useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import NotificationBanner from './components/NotificationBanner';
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

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function AppContent() {
  const { activeTab, dispatch } = useApp();
  const { currentUser } = useAuth();

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
    'supplier-accounts': <SupplierAccounts />,
    reports: <Reports />,
    users: <UserManagement />,
    network: <Network />,
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {PAGE[activeTab] || <Dashboard />}
        </main>
      </div>
      <NotificationBanner />
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
