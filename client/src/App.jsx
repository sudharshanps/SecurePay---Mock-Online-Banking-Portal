import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import DemoBanner from './components/DemoBanner.jsx';

import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import AccountDetailsPage from './pages/AccountDetailsPage.jsx';
import TransferMoneyPage from './pages/TransferMoneyPage.jsx';
import TransactionsPage from './pages/TransactionsPage.jsx';
import AccountStatementPage from './pages/AccountStatementPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

// Protected layout component
const AuthenticatedLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-500 font-semibold tracking-wide">
            Loading TrustBank Digital SecurePay...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <DemoBanner />
      <Header
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        isSidebarOpen={sidebarOpen}
      />

      <div className="flex-1 flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 lg:pl-64 flex flex-col justify-between">
          <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>

          <footer className="mt-8 py-4 px-6 text-center text-[11px] text-slate-400 border-t border-slate-200 bg-white">
            TrustBank Digital SecurePay Portal — Simulation Demo. No real currency is stored or transferred.
          </footer>
        </main>
      </div>
    </div>
  );
};

// Admin route guard
const AdminRoute = () => {
  const { isAdmin, loading } = useAuth();

  if (loading) return null;
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  return <AdminDashboardPage />;
};

export const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Authentication routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Authenticated routes */}
          <Route element={<AuthenticatedLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/accounts" element={<AccountDetailsPage />} />
            <Route path="/transfer" element={<TransferMoneyPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/statement" element={<AccountStatementPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminRoute />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
