import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import api from '../services/api.js';
import {
  CreditCard,
  ShieldCheck,
  Calendar,
  User,
  ArrowRightLeft,
  Copy,
  Check,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import TransactionTable from '../components/TransactionTable.jsx';
import TransferReceiptModal from '../components/TransferReceiptModal.jsx';

export const AccountDetailsPage = () => {
  const { user } = useAuth();
  const [accountData, setAccountData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [recentLedger, setRecentLedger] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const [accRes, txRes] = await Promise.all([
          api.get('/accounts/me'),
          api.get('/transactions?limit=10'),
        ]);

        if (accRes.success) {
          setAccountData(accRes.account);
        }
        if (txRes.success) {
          setRecentLedger(txRes.transactions);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch account information.');
      } finally {
        setLoading(false);
      }
    };

    fetchAccount();
  }, []);

  const copyAccountNumber = () => {
    if (accountData?.accountNumber) {
      navigator.clipboard.writeText(accountData.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Bank Account Details
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Simulated TrustBank Digital Account Management & Ledger Status
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Visual Debit/ATM Card Presentation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-tr from-navy-950 via-navy-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col justify-between h-56 border border-navy-800">
            {/* Card Top */}
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold tracking-tight block">TrustBank</span>
                  <span className="text-[9px] text-teal-400 font-semibold tracking-widest uppercase">Platinum Mock</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase">
                {accountData?.accountType || 'Savings'}
              </span>
            </div>

            {/* Card Account Number */}
            <div>
              <span className="text-[10px] text-slate-400 font-medium block mb-1">Dummy Account Number</span>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-mono tracking-wider font-semibold">
                  {accountData?.accountNumber || '•••• •••• ••••'}
                </span>
                <button
                  type="button"
                  onClick={copyAccountNumber}
                  className="p-1 rounded text-slate-400 hover:text-white"
                  title="Copy account number"
                >
                  {copied ? <Check className="w-4 h-4 text-teal-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Card Bottom: Holder Name & Expiry */}
            <div className="flex justify-between items-end border-t border-white/10 pt-3">
              <div>
                <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Account Holder</span>
                <span className="text-xs font-semibold tracking-wide uppercase">{user?.name}</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Currency</span>
                <span className="text-xs font-bold text-teal-300 font-mono">INR (₹)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Account Specification Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Account Specifications</h2>
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="capitalize">{accountData?.status || 'Active'}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Account Holder Name</span>
              <p className="font-semibold text-slate-900 text-sm">{user?.name}</p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Current Available Balance</span>
              <p className="font-bold text-blue-600 text-base">{accountData?.formattedBalance}</p>
              <span className="text-[10px] text-slate-400">Stored as: {accountData?.balancePaise?.toLocaleString('en-IN')} integer paise</span>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Primary Account Number</span>
              <p className="font-mono font-bold text-slate-900 text-sm">{accountData?.accountNumber}</p>
              <span className="text-[10px] text-slate-400">Masked: {accountData?.maskedAccountNumber}</span>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Account Type</span>
              <p className="font-semibold text-slate-900 capitalize">{accountData?.accountType} Account</p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Simulated IFSC Code</span>
              <p className="font-mono font-bold text-slate-700">TRST0009999</p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Account Opening Date</span>
              <p className="font-semibold text-slate-700">
                {accountData?.createdAt ? new Date(accountData.createdAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                }) : 'N/A'}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <Link
              to="/transfer"
              className="py-2 px-4 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1.5"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-teal-400" />
              <span>Initiate Transfer</span>
            </Link>

            <Link
              to="/statement"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Download Official Statement</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Account Activity Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Recent Account Activity</h2>
          <Link to="/transactions" className="text-xs font-semibold text-blue-600 hover:underline">
            View All Ledger Entries
          </Link>
        </div>

        <TransactionTable
          transactions={recentLedger}
          onViewReceipt={(tx) => setSelectedReceipt(tx)}
          emptyMessage="No ledger records recorded for this account."
        />
      </div>

      <TransferReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        receipt={selectedReceipt}
      />
    </div>
  );
};

export default AccountDetailsPage;
