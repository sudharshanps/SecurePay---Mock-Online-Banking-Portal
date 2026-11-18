import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import api from '../services/api.js';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard.jsx';
import QuickActions from '../components/QuickActions.jsx';
import MonthlyChart from '../components/MonthlyChart.jsx';
import TransactionTable from '../components/TransactionTable.jsx';
import TransferReceiptModal from '../components/TransferReceiptModal.jsx';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/accounts/summary');
      if (data.success) {
        setSummaryData(data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleViewReceipt = async (tx) => {
    if (tx.transferId) {
      try {
        const res = await api.get(`/transfers/${tx.transferId}/receipt`);
        if (res.success) {
          setSelectedReceipt(res.receipt);
        }
      } catch (err) {
        // Fallback to basic receipt modal using transaction data
        setSelectedReceipt({
          referenceId: tx.referenceId,
          amountRupees: tx.amountRupees,
          formattedAmount: tx.formattedAmount,
          status: tx.status || 'COMPLETED',
          timestamp: tx.createdAt,
          description: tx.description,
          sender: { name: user?.name, maskedAccountNumber: summaryData?.account?.maskedAccountNumber },
          recipient: { name: tx.counterpartyName, maskedAccountNumber: tx.counterpartyAccountNumber },
        });
      }
    }
  };

  if (loading && !summaryData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-500 font-medium">Loading TrustBank SecurePay Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold mb-2 border border-teal-500/30">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
              <span>Account Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {user?.name || 'Customer'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Account No: <span className="font-mono font-semibold text-teal-300">{summaryData?.account?.maskedAccountNumber}</span> • {(summaryData?.account?.accountType || 'Savings').toUpperCase()}
            </p>
          </div>

          <button
            type="button"
            onClick={fetchDashboardData}
            className="self-start md:self-center inline-flex items-center space-x-2 px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold transition-colors border border-white/10"
          >
            <RefreshCw className="w-3.5 h-3.5 text-teal-400" />
            <span>Refresh Balances</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Primary Financial Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Available Account Balance"
          value={summaryData?.account?.formattedBalance || '₹0.00'}
          subtext="Simulated balance stored in integer paise"
          icon={Wallet}
          variant="blue"
          badge="Ready to transfer"
        />
        <StatCard
          title="Total Money Credited"
          value={summaryData?.statistics?.formattedTotalCredited || '₹0.00'}
          subtext="Cumulative inflows and deposits"
          icon={ArrowDownLeft}
          variant="teal"
        />
        <StatCard
          title="Total Money Debited"
          value={summaryData?.statistics?.formattedTotalDebited || '₹0.00'}
          subtext="Cumulative fund transfers & payments"
          icon={ArrowUpRight}
          variant="rose"
        />
      </div>

      {/* Quick Action Navigation */}
      <QuickActions />

      {/* Income & Expense Chart */}
      <MonthlyChart data={summaryData?.monthlySummary || []} />

      {/* Recent Transactions Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Transactions</h2>
            <p className="text-xs text-slate-500">Latest 5 account ledger activities</p>
          </div>
          <Link
            to="/transactions"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <span>View All</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <TransactionTable
          transactions={summaryData?.recentTransactions || []}
          onViewReceipt={handleViewReceipt}
          emptyMessage="No recent transactions found on this account."
        />
      </div>

      {/* Receipt Modal */}
      <TransferReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        receipt={selectedReceipt}
      />
    </div>
  );
};

export default DashboardPage;
