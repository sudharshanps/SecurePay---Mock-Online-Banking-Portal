import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import {
  FileText,
  Download,
  Calendar,
  FileSpreadsheet,
  RefreshCw,
  AlertCircle,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { downloadStatementPDF, exportStatementCSV } from '../services/pdfService.js';
import TransactionTable from '../components/TransactionTable.jsx';
import StatCard from '../components/StatCard.jsx';

export const AccountStatementPage = () => {
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Period filters
  const [periodPreset, setPeriodPreset] = useState('30days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchStatement = async (start = '', end = '') => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (start) params.set('startDate', start);
    if (end) params.set('endDate', end);

    try {
      const data = await api.get(`/transactions/statement?${params.toString()}`);
      if (data.success && data.statement) {
        setStatement(data.statement);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate account statement.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch defaults to last 30 days
    fetchStatement();
  }, []);

  const handlePresetChange = (preset) => {
    setPeriodPreset(preset);
    const now = new Date();
    let start = new Date();

    if (preset === '30days') {
      start.setDate(now.getDate() - 30);
    } else if (preset === '90days') {
      start.setDate(now.getDate() - 90);
    } else if (preset === '180days') {
      start.setDate(now.getDate() - 180);
    } else if (preset === 'custom') {
      return;
    }

    const startIso = start.toISOString().slice(0, 10);
    const endIso = now.toISOString().slice(0, 10);
    setStartDate(startIso);
    setEndDate(endIso);
    fetchStatement(startIso, endIso);
  };

  const handleCustomApply = (e) => {
    e.preventDefault();
    if (startDate && endDate) {
      fetchStatement(startDate, endDate);
    }
  };

  const handleDownloadPDF = () => {
    if (statement) {
      downloadStatementPDF(statement);
    }
  };

  const handleExportCSV = () => {
    if (statement) {
      exportStatementCSV(statement);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Account Statement
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Official simulated statement with opening/closing balances and ledger logs
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={!statement || loading}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={!statement || loading}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Period Selection Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: '30days', label: 'Last 30 Days' },
              { id: '90days', label: 'Last 90 Days' },
              { id: '180days', label: 'Last 6 Months' },
              { id: 'custom', label: 'Custom Range' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePresetChange(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  periodPreset === p.id
                    ? 'bg-navy-900 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {statement && (
            <div className="text-xs text-slate-500 font-medium">
              Period:{' '}
              <strong className="text-slate-800">
                {new Date(statement.period.startDate).toLocaleDateString('en-IN')}
              </strong>{' '}
              to{' '}
              <strong className="text-slate-800">
                {new Date(statement.period.endDate).toLocaleDateString('en-IN')}
              </strong>
            </div>
          )}
        </div>

        {periodPreset === 'custom' && (
          <form onSubmit={handleCustomApply} className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-medium">From:</span>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-medium">To:</span>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              Update Statement
            </button>
          </form>
        )}
      </div>

      {/* Statement Summary Figures Grid */}
      {statement && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Opening Balance
            </span>
            <span className="text-xl font-bold text-slate-800 mt-1 block">
              {statement.summary.formattedOpeningBalance}
            </span>
            <span className="text-[10px] text-slate-400">At period start</span>
          </div>

          <div className="bg-white rounded-xl p-4 border border-teal-100 shadow-xs">
            <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">
              Total Deposits (+)
            </span>
            <span className="text-xl font-bold text-teal-600 mt-1 block">
              +{statement.summary.formattedTotalCredits}
            </span>
            <span className="text-[10px] text-slate-400">Inflows during period</span>
          </div>

          <div className="bg-white rounded-xl p-4 border border-rose-100 shadow-xs">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
              Total Debits (-)
            </span>
            <span className="text-xl font-bold text-rose-600 mt-1 block">
              -{statement.summary.formattedTotalDebits}
            </span>
            <span className="text-[10px] text-slate-400">Outflows during period</span>
          </div>

          <div className="bg-white rounded-xl p-4 border border-blue-100 shadow-xs">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
              Closing Balance
            </span>
            <span className="text-xl font-bold text-blue-900 mt-1 block">
              {statement.summary.formattedClosingBalance}
            </span>
            <span className="text-[10px] text-slate-400">At period conclusion</span>
          </div>
        </div>
      )}

      {/* Statement Ledger Transactions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Statement Ledger Entries ({statement?.transactions?.length || 0})
          </h2>
          <span className="text-xs text-slate-400">Chronological Itemized Records</span>
        </div>

        <TransactionTable
          transactions={statement?.transactions || []}
          emptyMessage="No financial ledger entries found for the selected period."
        />
      </div>
    </div>
  );
};

export default AccountStatementPage;
