import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Receipt, FileText } from 'lucide-react';

export const TransactionTable = ({
  transactions = [],
  onViewReceipt = null,
  emptyMessage = 'No transactions recorded yet.',
}) => {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 border border-slate-200 text-center text-slate-400 text-sm">
        <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Reference ID</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4">Counterparty</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4 text-right">Balance After</th>
              {onViewReceipt && <th className="py-3 px-4 text-center">Receipt</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {transactions.map((tx) => {
              const isCredit = tx.entryType === 'CREDIT';
              return (
                <tr key={tx.id || tx.referenceId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-medium">
                    {new Date(tx.createdAt || tx.date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] font-medium text-slate-600">
                    {tx.referenceId}
                  </td>
                  <td className="py-3.5 px-4 max-w-xs truncate font-medium text-slate-900">
                    {tx.description || 'Mock Transfer'}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                    <span className="font-medium text-slate-800">{tx.counterpartyName || 'TrustBank User'}</span>
                    {tx.maskedCounterpartyAccountNumber && (
                      <span className="block text-[10px] text-slate-400 font-mono">
                        {tx.maskedCounterpartyAccountNumber}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isCredit
                          ? 'bg-teal-50 text-teal-700 border border-teal-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="w-3 h-3 text-teal-600" />
                      ) : (
                        <ArrowUpRight className="w-3 h-3 text-rose-600" />
                      )}
                      <span>{isCredit ? 'CREDIT' : 'DEBIT'}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-right font-bold">
                    <span className={isCredit ? 'text-teal-600' : 'text-slate-900'}>
                      {isCredit ? '+' : '-'}{tx.formattedAmount || `₹${tx.amountRupees}`}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-right font-mono font-medium text-slate-600">
                    {tx.formattedBalanceAfter || '—'}
                  </td>
                  {onViewReceipt && (
                    <td className="py-3.5 px-4 whitespace-nowrap text-center">
                      <button
                        type="button"
                        onClick={() => onViewReceipt(tx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-navy-900 hover:bg-slate-100 transition-colors"
                        title="View & Download Receipt"
                      >
                        <Receipt className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionTable;
