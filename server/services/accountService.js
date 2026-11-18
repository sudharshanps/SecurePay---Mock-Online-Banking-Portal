import BankAccount from '../models/BankAccount.js';
import LedgerEntry from '../models/LedgerEntry.js';
import {
  LEDGER_ENTRY_TYPES,
  formatINR,
  paiseToRupees,
  maskAccountNumber,
} from '../config/constants.js';

/**
 * Get account details for a user
 */
export const getAccountByUserId = async (userId) => {
  const account = await BankAccount.findOne({ userId }).populate('userId', 'name email phone');
  if (!account) {
    const error = new Error('No bank account found for this user.');
    error.statusCode = 404;
    throw error;
  }

  const accountObj = account.toJSON();
  return {
    ...accountObj,
    maskedAccountNumber: maskAccountNumber(account.accountNumber),
    formattedBalance: formatINR(account.balancePaise),
    balanceRupees: paiseToRupees(account.balancePaise),
  };
};

/**
 * Get comprehensive account summary and statistics
 */
export const getAccountSummary = async (userId) => {
  const account = await BankAccount.findOne({ userId });
  if (!account) {
    const error = new Error('Bank account not found');
    error.statusCode = 404;
    throw error;
  }

  // Calculate total credited and debited from ledger entries
  const [totals] = await LedgerEntry.aggregate([
    { $match: { accountId: account._id } },
    {
      $group: {
        _id: null,
        totalCreditedPaise: {
          $sum: {
            $cond: [{ $eq: ['$entryType', LEDGER_ENTRY_TYPES.CREDIT] }, '$amountPaise', 0],
          },
        },
        totalDebitedPaise: {
          $sum: {
            $cond: [{ $eq: ['$entryType', LEDGER_ENTRY_TYPES.DEBIT] }, '$amountPaise', 0],
          },
        },
        totalCount: { $sum: 1 },
      },
    },
  ]);

  const totalCreditedPaise = totals?.totalCreditedPaise || 0;
  const totalDebitedPaise = totals?.totalDebitedPaise || 0;

  // Recent 5 transactions
  const recentTransactions = await LedgerEntry.find({ accountId: account._id })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('transferId', 'referenceId status');

  // Monthly summary for income vs expense chart (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const monthlyStats = await LedgerEntry.aggregate([
    {
      $match: {
        accountId: account._id,
        createdAt: { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          type: '$entryType',
        },
        totalAmountPaise: { $sum: '$amountPaise' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // Transform monthly stats into chart-friendly format
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const chartDataMap = {};

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    chartDataMap[key] = {
      month: monthNames[d.getMonth()],
      year: d.getFullYear(),
      credits: 0,
      debits: 0,
    };
  }

  monthlyStats.forEach((stat) => {
    const key = `${stat._id.year}-${stat._id.month}`;
    if (chartDataMap[key]) {
      const rupees = paiseToRupees(stat.totalAmountPaise);
      if (stat._id.type === LEDGER_ENTRY_TYPES.CREDIT) {
        chartDataMap[key].credits = rupees;
      } else {
        chartDataMap[key].debits = rupees;
      }
    }
  });

  const chartData = Object.values(chartDataMap);

  return {
    account: {
      id: account._id,
      accountNumber: account.accountNumber,
      maskedAccountNumber: maskAccountNumber(account.accountNumber),
      accountType: account.accountType,
      status: account.status,
      balancePaise: account.balancePaise,
      balanceRupees: paiseToRupees(account.balancePaise),
      formattedBalance: formatINR(account.balancePaise),
      createdAt: account.createdAt,
    },
    statistics: {
      totalCreditedPaise,
      totalCreditedRupees: paiseToRupees(totalCreditedPaise),
      formattedTotalCredited: formatINR(totalCreditedPaise),
      totalDebitedPaise,
      totalDebitedRupees: paiseToRupees(totalDebitedPaise),
      formattedTotalDebited: formatINR(totalDebitedPaise),
      netSavingsPaise: totalCreditedPaise - totalDebitedPaise,
      transactionCount: totals?.totalCount || 0,
    },
    recentTransactions: recentTransactions.map((tx) => ({
      id: tx._id,
      referenceId: tx.transferId?.referenceId || 'N/A',
      entryType: tx.entryType,
      amountPaise: tx.amountPaise,
      amountRupees: paiseToRupees(tx.amountPaise),
      formattedAmount: formatINR(tx.amountPaise),
      balanceAfterPaise: tx.balanceAfterPaise,
      balanceAfterRupees: paiseToRupees(tx.balanceAfterPaise),
      description: tx.description,
      counterpartyName: tx.counterpartyName || 'TrustBank Counterparty',
      counterpartyAccountNumber: maskAccountNumber(tx.counterpartyAccountNumber),
      createdAt: tx.createdAt,
    })),
    monthlySummary: chartData,
  };
};
