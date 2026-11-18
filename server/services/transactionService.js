import LedgerEntry from '../models/LedgerEntry.js';
import BankAccount from '../models/BankAccount.js';
import Transfer from '../models/Transfer.js';
import {
  LEDGER_ENTRY_TYPES,
  formatINR,
  paiseToRupees,
  maskAccountNumber,
} from '../config/constants.js';

/**
 * Get paginated transaction history with filtering and search
 */
export const getTransactions = async (userId, query = {}) => {
  const account = await BankAccount.findOne({ userId });
  if (!account) {
    const error = new Error('Bank account not found');
    error.statusCode = 404;
    throw error;
  }

  const {
    type,
    search,
    startDate,
    endDate,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query;

  const filter = { accountId: account._id };

  // Filter by Credit / Debit type
  if (type && Object.values(LEDGER_ENTRY_TYPES).includes(type.toUpperCase())) {
    filter.entryType = type.toUpperCase();
  }

  // Filter by date range
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      filter.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  // Search by description or counterparty name
  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { description: searchRegex },
      { counterpartyName: searchRegex },
      { counterpartyAccountNumber: searchRegex },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const sortDirection = sortOrder === 'asc' ? 1 : -1;
  const sortOptions = { [sortBy]: sortDirection };

  const [totalCount, entries] = await Promise.all([
    LedgerEntry.countDocuments(filter),
    LedgerEntry.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .populate('transferId', 'referenceId status failureReason'),
  ]);

  const transactions = entries.map((entry) => ({
    id: entry._id,
    transferId: entry.transferId?._id,
    referenceId: entry.transferId?.referenceId || 'N/A',
    status: entry.transferId?.status || 'COMPLETED',
    entryType: entry.entryType,
    isCredit: entry.entryType === LEDGER_ENTRY_TYPES.CREDIT,
    isDebit: entry.entryType === LEDGER_ENTRY_TYPES.DEBIT,
    amountPaise: entry.amountPaise,
    amountRupees: paiseToRupees(entry.amountPaise),
    formattedAmount: formatINR(entry.amountPaise),
    balanceAfterPaise: entry.balanceAfterPaise,
    balanceAfterRupees: paiseToRupees(entry.balanceAfterPaise),
    formattedBalanceAfter: formatINR(entry.balanceAfterPaise),
    description: entry.description,
    counterpartyName: entry.counterpartyName || 'TrustBank Counterparty',
    counterpartyAccountNumber: entry.counterpartyAccountNumber,
    maskedCounterpartyAccountNumber: maskAccountNumber(entry.counterpartyAccountNumber),
    createdAt: entry.createdAt,
  }));

  return {
    transactions,
    pagination: {
      total: totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum),
      hasNextPage: pageNum * limitNum < totalCount,
      hasPrevPage: pageNum > 1,
    },
  };
};

/**
 * Get detailed transaction by ID
 */
export const getTransactionById = async (userId, transactionId) => {
  const account = await BankAccount.findOne({ userId });
  if (!account) {
    const error = new Error('Bank account not found');
    error.statusCode = 404;
    throw error;
  }

  const entry = await LedgerEntry.findOne({
    _id: transactionId,
    accountId: account._id,
  }).populate({
    path: 'transferId',
    populate: [
      { path: 'senderAccountId', populate: { path: 'userId', select: 'name' } },
      { path: 'recipientAccountId', populate: { path: 'userId', select: 'name' } },
    ],
  });

  if (!entry) {
    const error = new Error('Transaction record not found.');
    error.statusCode = 404;
    throw error;
  }

  const transfer = entry.transferId;

  return {
    id: entry._id,
    transferId: transfer?._id,
    referenceId: transfer?.referenceId || 'N/A',
    status: transfer?.status || 'COMPLETED',
    entryType: entry.entryType,
    amountPaise: entry.amountPaise,
    amountRupees: paiseToRupees(entry.amountPaise),
    formattedAmount: formatINR(entry.amountPaise),
    balanceAfterPaise: entry.balanceAfterPaise,
    formattedBalanceAfter: formatINR(entry.balanceAfterPaise),
    description: entry.description,
    createdAt: entry.createdAt,
    sender: {
      name: transfer?.senderAccountId?.userId?.name || 'Sender',
      accountNumber: transfer?.senderAccountId?.accountNumber,
      maskedAccountNumber: maskAccountNumber(transfer?.senderAccountId?.accountNumber),
    },
    recipient: {
      name: transfer?.recipientAccountId?.userId?.name || 'Recipient',
      accountNumber: transfer?.recipientAccountId?.accountNumber,
      maskedAccountNumber: maskAccountNumber(transfer?.recipientAccountId?.accountNumber),
    },
  };
};

/**
 * Generate account statement with opening/closing balances and period totals
 */
export const getAccountStatement = async (userId, { startDate, endDate }) => {
  const account = await BankAccount.findOne({ userId }).populate('userId', 'name email phone');
  if (!account) {
    const error = new Error('Bank account not found');
    error.statusCode = 404;
    throw error;
  }

  // Default to last 30 days if no range provided
  const end = endDate ? new Date(endDate) : new Date();
  end.setHours(23, 59, 59, 999);

  const start = startDate ? new Date(startDate) : new Date();
  if (!startDate) {
    start.setDate(start.getDate() - 30);
  }
  start.setHours(0, 0, 0, 0);

  // Fetch all transactions in period
  const entries = await LedgerEntry.find({
    accountId: account._id,
    createdAt: { $gte: start, $lte: end },
  })
    .sort({ createdAt: 1 })
    .populate('transferId', 'referenceId status');

  // Find the last entry BEFORE startDate to determine opening balance
  const priorEntry = await LedgerEntry.findOne({
    accountId: account._id,
    createdAt: { $lt: start },
  }).sort({ createdAt: -1 });

  let openingBalancePaise = 0;
  if (priorEntry) {
    openingBalancePaise = priorEntry.balanceAfterPaise;
  } else if (entries.length > 0) {
    // If no prior entry, calculate opening balance from the first entry
    const first = entries[0];
    if (first.entryType === LEDGER_ENTRY_TYPES.CREDIT) {
      openingBalancePaise = first.balanceAfterPaise - first.amountPaise;
    } else {
      openingBalancePaise = first.balanceAfterPaise + first.amountPaise;
    }
  } else {
    // If no entries at all, current balance
    openingBalancePaise = account.balancePaise;
  }

  let totalCreditsPaise = 0;
  let totalDebitsPaise = 0;

  const itemizedList = entries.map((entry) => {
    if (entry.entryType === LEDGER_ENTRY_TYPES.CREDIT) {
      totalCreditsPaise += entry.amountPaise;
    } else {
      totalDebitsPaise += entry.amountPaise;
    }

    return {
      id: entry._id,
      date: entry.createdAt,
      referenceId: entry.transferId?.referenceId || 'N/A',
      description: entry.description,
      entryType: entry.entryType,
      counterpartyName: entry.counterpartyName || 'TrustBank Counterparty',
      counterpartyAccountNumber: maskAccountNumber(entry.counterpartyAccountNumber),
      amountPaise: entry.amountPaise,
      amountRupees: paiseToRupees(entry.amountPaise),
      formattedAmount: formatINR(entry.amountPaise),
      balanceAfterPaise: entry.balanceAfterPaise,
      balanceAfterRupees: paiseToRupees(entry.balanceAfterPaise),
      formattedBalanceAfter: formatINR(entry.balanceAfterPaise),
    };
  });

  const closingBalancePaise = entries.length > 0
    ? entries[entries.length - 1].balanceAfterPaise
    : openingBalancePaise;

  return {
    accountHolder: {
      name: account.userId.name,
      email: account.userId.email,
      phone: account.userId.phone,
      accountNumber: account.accountNumber,
      maskedAccountNumber: maskAccountNumber(account.accountNumber),
      accountType: account.accountType,
      status: account.status,
    },
    period: {
      startDate: start,
      endDate: end,
    },
    summary: {
      openingBalancePaise,
      openingBalanceRupees: paiseToRupees(openingBalancePaise),
      formattedOpeningBalance: formatINR(openingBalancePaise),
      closingBalancePaise,
      closingBalanceRupees: paiseToRupees(closingBalancePaise),
      formattedClosingBalance: formatINR(closingBalancePaise),
      totalCreditsPaise,
      totalCreditsRupees: paiseToRupees(totalCreditsPaise),
      formattedTotalCredits: formatINR(totalCreditsPaise),
      totalDebitsPaise,
      totalDebitsRupees: paiseToRupees(totalDebitsPaise),
      formattedTotalDebits: formatINR(totalDebitsPaise),
      transactionCount: entries.length,
    },
    transactions: itemizedList,
  };
};
