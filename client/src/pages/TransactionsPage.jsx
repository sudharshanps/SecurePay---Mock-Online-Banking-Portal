import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import {
  Search,
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Receipt,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import TransactionTable from '../components/TransactionTable.jsx';
import TransferReceiptModal from '../components/TransferReceiptModal.jsx';

export const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', 10);
    if (search.trim()) params.set('search', search.trim());
    if (type) params.set('type', type);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);

    try {
      const data = await api.get(`/transactions?${params.toString()}`);
      if (data.success) {
        setTransactions(data.transactions || []);
        setPagination(data.pagination || { page: 1, limit: 10, totalPages: 1, total: 0 });
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch transaction history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, type]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const handleResetFilters = () => {
    setSearch('');
    setType('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleViewReceipt = async (tx) => {
    if (tx.transferId) {
      try {
        const res = await api.get(`/transfers/${tx.transferId}/receipt`);
        if (res.success) {
          setSelectedReceipt(res.receipt);
          return;
        }
      } catch (err) {
        console.warn('Could not fetch full receipt, using local tx data.');
      }
    }

    setSelectedReceipt({
      referenceId: tx.referenceId,
      amountRupees: tx.amountRupees,
      formattedAmount: tx.formattedAmount,
      status: tx.status || 'COMPLETED',
      timestamp: tx.createdAt,
      description: tx.description,
      sender: { name: 'TrustBank Account', maskedAccountNumber: '•••• ••••' },
      recipient: { name: tx.counterpartyName, maskedAccountNumber: tx.counterpartyAccountNumber },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Transaction History
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse and filter all simulated debit and credit ledger records
          </p>
        </div>

        <button
          type="button"
          onClick={fetchTransactions}
          className="self-start sm:self-center inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search text */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search description / party..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>

          {/* Type filter */}
          <div>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-white text-slate-700 font-medium"
            >
              <option value="">All Transactions</option>
              <option value="CREDIT">Credits Only (+)</option>
              <option value="DEBIT">Debits Only (-)</option>
            </select>
          </div>

          {/* Date range start */}
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden text-slate-700"
              title="Start Date"
            />
          </div>

          {/* Date range end */}
          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden text-slate-700"
              title="End Date"
            />
          </div>
        </form>

        <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
          <div className="text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{transactions.length}</strong> of{' '}
            <strong className="text-slate-900">{pagination.total}</strong> records
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => {
                setPage(1);
                fetchTransactions();
              }}
              className="px-3.5 py-1.5 bg-navy-900 hover:bg-navy-800 text-white rounded-lg font-semibold shadow-xs"
            >
              Apply Filter
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <TransactionTable
        transactions={transactions}
        onViewReceipt={handleViewReceipt}
        emptyMessage="No transactions match your search or filter parameters."
      />

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-xs text-xs">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-semibold disabled:opacity-40 hover:bg-slate-50"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="text-slate-600 font-medium">
            Page <strong className="text-slate-900">{pagination.page}</strong> of{' '}
            <strong className="text-slate-900">{pagination.totalPages}</strong>
          </span>

          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(page + 1)}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-semibold disabled:opacity-40 hover:bg-slate-50"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Receipt Modal */}
      <TransferReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        receipt={selectedReceipt}
      />
    </div>
  );
};

export default TransactionsPage;
