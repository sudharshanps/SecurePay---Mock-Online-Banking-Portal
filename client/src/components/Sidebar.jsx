import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import {
  LayoutDashboard,
  CreditCard,
  SendHorizontal,
  ArrowLeftRight,
  FileText,
  UserCheck,
  ShieldAlert,
  LogOut,
  HelpCircle,
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/accounts', label: 'My Account', icon: CreditCard },
    { to: '/transfer', label: 'Transfer Money', icon: SendHorizontal },
    { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
    { to: '/statement', label: 'Account Statement', icon: FileText },
    { to: '/profile', label: 'Profile & Security', icon: UserCheck },
  ];

  if (isAdmin) {
    navLinks.push({ to: '/admin', label: 'Admin Portal', icon: ShieldAlert });
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-navy-950 text-slate-300 flex flex-col justify-between transition-transform duration-200 ease-in-out border-r border-navy-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="h-16 flex items-center px-6 border-b border-navy-800/80">
            <span className="text-white font-bold tracking-tight text-lg flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400 inline-block animate-pulse"></span>
              <span>TrustBank Digital</span>
            </span>
          </div>

          {/* Navigation links */}
          <nav className="p-4 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-navy-900'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="p-4 border-t border-navy-800/80 space-y-3">
          <div className="bg-navy-900/80 rounded-lg p-3 text-xs border border-navy-800">
            <div className="flex items-center space-x-1.5 text-teal-400 font-medium mb-1">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Simulated Sandbox</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Amounts and transactions are mock records stored in integer paise for academic demonstration.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-rose-300 hover:text-white hover:bg-rose-500/20 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0 text-rose-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
