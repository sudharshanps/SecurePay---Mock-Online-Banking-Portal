import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SendHorizontal, ArrowLeftRight, CreditCard } from 'lucide-react';

export const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'Quick Transfer',
      desc: 'Send money instantly to dummy accounts',
      icon: SendHorizontal,
      color: 'bg-teal-600 hover:bg-teal-700 text-white',
      onClick: () => navigate('/transfer'),
    },
    {
      label: 'View Transactions',
      desc: 'Browse history, filters & download receipts',
      icon: ArrowLeftRight,
      color: 'bg-navy-900 hover:bg-navy-800 text-white',
      onClick: () => navigate('/transactions'),
    },
    {
      label: 'Account Details',
      desc: 'View balance, account number & limits',
      icon: CreditCard,
      color: 'bg-blue-600 hover:bg-blue-700 text-white',
      onClick: () => navigate('/accounts'),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {actions.map((act) => {
        const Icon = act.icon;
        return (
          <button
            key={act.label}
            type="button"
            onClick={act.onClick}
            className={`${act.color} p-4 rounded-xl shadow-xs transition-all flex items-center justify-between text-left group`}
          >
            <div>
              <div className="font-bold text-sm tracking-tight">{act.label}</div>
              <div className="text-[11px] opacity-80 mt-0.5">{act.desc}</div>
            </div>
            <div className="p-2 rounded-lg bg-white/10 group-hover:scale-105 transition-transform">
              <Icon className="w-5 h-5" />
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default QuickActions;
