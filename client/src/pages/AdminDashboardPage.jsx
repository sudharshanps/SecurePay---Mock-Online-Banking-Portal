import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import {
  ShieldAlert,
  Users,
  CreditCard,
  ArrowRightLeft,
  Coins,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Lock,
  Unlock,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import StatCard from '../components/StatCard.jsx';

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(null);

  // Tabs: 'accounts' or 'audit'
  const [activeTab, setActiveTab] = useState('accounts');

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, accRes, auditRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get(`/admin/accounts?search=${encodeURIComponent(search)}&status=${encodeURIComponent(statusFilter)}`),
        api.get('/admin/audit-logs?limit=25'),
      ]);

      if (dashRes.success) setStats(dashRes.statistics);
      if (accRes.success) setAccounts(accRes.accounts || []);
      if (auditRes.success) setAuditLogs(auditRes.logs || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch administrator data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAdminData();
  };

  const handleToggleAccountStatus = async (account) => {
    const nextStatus = account.status === 'active' ? 'suspended' : 'active';
    setStatusUpdating(account.id);
    try {
      const res = await api.patch(`/admin/accounts/${account.id}/status`, {
        status: nextStatus,
      });
      if (res.success) {
        setAccounts((prev) =>
          prev.map((acc) =>
            acc.id === account.id ? { ...acc, status: nextStatus } : acc
          )
        );
      }
    } catch (err) {
      alert(`Could not change status: ${err.message}`);
    } finally {
      setStatusUpdating(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Banner */}
      <div className="bg-navy-950 rounded-2xl p-6 text-white shadow-lg border border-navy-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold mb-2 border border-rose-500/30 uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Administrator Security Portal</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            TrustBank System Oversight & Governance
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Aggregate mock bank balances, customer controls, and real-time security audit trails
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAdminData}
          className="self-start md:self-center inline-flex items-center space-x-2 px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold transition-colors border border-white/10"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Registered Customers"
          value={stats?.totalCustomers || 0}
          subtext="Simulated retail & current users"
          icon={Users}
          variant="blue"
        />
        <StatCard
          title="Active Bank Accounts"
          value={`${stats?.activeAccountsCount || 0} / ${stats?.totalAccounts || 0}`}
          subtext={`${stats?.suspendedAccountsCount || 0} accounts suspended`}
          icon={CreditCard}
          variant="teal"
        />
        <StatCard
          title="Total Mock Transfers"
          value={stats?.totalTransfers || 0}
          subtext="Completed ledger movements"
          icon={ArrowRightLeft}
          variant="emerald"
        />
        <StatCard
          title="Aggregate Demo Liquidity"
          value={stats?.formattedAggregateBalance || '₹0.00'}
          subtext="Total simulated funds in vault"
          icon={Coins}
          variant="rose"
        />
      </div>

      {/* Admin Tab Navigation */}
      <div className="flex border-b border-slate-200 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('accounts')}
          className={`py-3 px-4 border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'accounts'
              ? 'border-navy-900 text-navy-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Customer Accounts Management ({accounts.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`py-3 px-4 border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'audit'
              ? 'border-navy-900 text-navy-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Security Audit Trails ({auditLogs.length})</span>
        </button>
      </div>

      {activeTab === 'accounts' ? (
        /* Accounts Table Tab */
        <div className="space-y-4">
          {/* Search bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 justify-between">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search customer name, email, or account number..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
              <button
                type="submit"
                className="py-2 px-3.5 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                Search
              </button>
            </form>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-white text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
            </select>
          </div>

          {/* Accounts List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Account Number</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-right">Simulated Balance</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {accounts.map((acc) => {
                    const isActive = acc.status === 'active';
                    return (
                      <tr key={acc.id} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                          {acc.accountNumber}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-semibold text-slate-900 block">{acc.user?.name}</span>
                          <span className="text-[11px] text-slate-400">{acc.user?.email}</span>
                        </td>
                        <td className="py-3.5 px-4 capitalize whitespace-nowrap">
                          {acc.accountType}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold font-mono text-slate-900 whitespace-nowrap">
                          {acc.formattedBalance}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {acc.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            disabled={statusUpdating === acc.id}
                            onClick={() => handleToggleAccountStatus(acc)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center space-x-1 mx-auto ${
                              isActive
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {isActive ? (
                              <>
                                <Lock className="w-3 h-3" />
                                <span>Suspend</span>
                              </>
                            ) : (
                              <>
                                <Unlock className="w-3 h-3" />
                                <span>Activate</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Audit Logs Tab */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Target Resource</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4 text-center">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="block font-medium text-slate-800">{log.actorEmail}</span>
                      <span className="text-[10px] text-slate-400 capitalize">{log.actorRole}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {log.resourceType}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.result === 'SUCCESS'
                            ? 'bg-teal-50 text-teal-700 border border-teal-200'
                            : log.result === 'WARNING'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {log.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
