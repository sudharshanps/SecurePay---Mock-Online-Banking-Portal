import React from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { Shield, Bell, Menu, X, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Header = ({ onToggleSidebar, isSidebarOpen }) => {
  const { user, account, logout } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Brand & Mobile Toggle */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden"
              aria-label="Toggle Sidebar"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to="/dashboard" className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-lg bg-navy-900 flex items-center justify-center text-teal-400 shadow-xs">
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-navy-900 leading-none">
                  TrustBank
                </span>
                <span className="text-[10px] font-semibold tracking-wider text-teal-600 uppercase">
                  Digital SecurePay
                </span>
              </div>
            </Link>
          </div>

          {/* Right: User Status & Profile */}
          <div className="flex items-center space-x-4">
            {/* Account pill */}
            {account && (
              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-xs text-slate-500 font-medium">Demo Account</span>
                <span className="text-xs font-mono font-semibold text-slate-800">
                  {account.maskedAccountNumber || account.accountNumber}
                </span>
              </div>
            )}

            {/* Notification indicator */}
            <div className="p-2 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-100 relative cursor-pointer">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal-500 rounded-full"></span>
            </div>

            {/* User Profile */}
            <Link
              to="/profile"
              className="flex items-center space-x-2.5 pl-2 py-1 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-navy-800 text-teal-300 font-bold text-xs flex items-center justify-center border border-navy-700">
                {getInitials(user?.name)}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-900 truncate max-w-[130px]">
                  {user?.name || 'Account'}
                </span>
                <span className="text-[10px] text-teal-600 font-medium capitalize">
                  {user?.role || 'Customer'}
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
