import User from '../models/User.js';
import BankAccount from '../models/BankAccount.js';
import Transfer from '../models/Transfer.js';
import LedgerEntry from '../models/LedgerEntry.js';
import AuditLog from '../models/AuditLog.js';
import {
  USER_ROLES,
  ACCOUNT_STATUS,
  AUDIT_ACTIONS,
  formatINR,
  paiseToRupees,
  maskAccountNumber,
} from '../config/constants.js';
import { logAudit } from '../services/auditService.js';

/**
 * Get system-wide metrics and summary for admin
 */
export const getAdminDashboard = async (req, res, next) => {
  try {
    const [
      totalCustomers,
      totalAccounts,
      totalTransfers,
      totalAuditLogs,
      balanceAggregation,
      recentTransfers,
    ] = await Promise.all([
      User.countDocuments({ role: USER_ROLES.CUSTOMER }),
      BankAccount.countDocuments(),
      Transfer.countDocuments(),
      AuditLog.countDocuments(),
      BankAccount.aggregate([
        {
          $group: {
            _id: null,
            aggregateBalancePaise: { $sum: '$balancePaise' },
            activeAccountsCount: {
              $sum: { $cond: [{ $eq: ['$status', ACCOUNT_STATUS.ACTIVE] }, 1, 0] },
            },
            suspendedAccountsCount: {
              $sum: { $cond: [{ $eq: ['$status', ACCOUNT_STATUS.SUSPENDED] }, 1, 0] },
            },
          },
        },
      ]),
      Transfer.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate({
          path: 'senderAccountId',
          populate: { path: 'userId', select: 'name email' },
        })
        .populate({
          path: 'recipientAccountId',
          populate: { path: 'userId', select: 'name email' },
        }),
    ]);

    const aggregateBalancePaise = balanceAggregation[0]?.aggregateBalancePaise || 0;
    const activeAccountsCount = balanceAggregation[0]?.activeAccountsCount || 0;
    const suspendedAccountsCount = balanceAggregation[0]?.suspendedAccountsCount || 0;

    res.json({
      success: true,
      statistics: {
        totalCustomers,
        totalAccounts,
        activeAccountsCount,
        suspendedAccountsCount,
        totalTransfers,
        totalAuditLogs,
        aggregateBalancePaise,
        aggregateBalanceRupees: paiseToRupees(aggregateBalancePaise),
        formattedAggregateBalance: formatINR(aggregateBalancePaise),
      },
      recentTransfers: recentTransfers.map((tx) => ({
        id: tx._id,
        referenceId: tx.referenceId,
        amount: formatINR(tx.amountPaise),
        amountPaise: tx.amountPaise,
        status: tx.status,
        description: tx.description,
        createdAt: tx.createdAt,
        sender: {
          name: tx.senderAccountId?.userId?.name || 'N/A',
          accountNumber: tx.senderAccountId?.accountNumber || 'N/A',
        },
        recipient: {
          name: tx.recipientAccountId?.userId?.name || 'N/A',
          accountNumber: tx.recipientAccountId?.accountNumber || 'N/A',
        },
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List customer accounts with search, status filtering, and pagination
 */
export const getAdminAccounts = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 15 } = req.query;

    const filter = {};
    if (status && Object.values(ACCOUNT_STATUS).includes(status)) {
      filter.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    let userIds = null;
    if (search && search.trim()) {
      const users = await User.find({
        $or: [
          { name: { $regex: search.trim(), $options: 'i' } },
          { email: { $regex: search.trim(), $options: 'i' } },
          { phone: { $regex: search.trim(), $options: 'i' } },
        ],
      }).select('_id');
      userIds = users.map((u) => u._id);
    }

    if (userIds !== null) {
      filter.$or = [
        { userId: { $in: userIds } },
        { accountNumber: { $regex: search.trim(), $options: 'i' } },
      ];
    } else if (search && search.trim()) {
      filter.accountNumber = { $regex: search.trim(), $options: 'i' };
    }

    const [total, accounts] = await Promise.all([
      BankAccount.countDocuments(filter),
      BankAccount.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('userId', 'name email phone role failedLoginAttempts lockUntil lastLoginAt createdAt'),
    ]);

    res.json({
      success: true,
      accounts: accounts.map((acc) => ({
        id: acc._id,
        accountNumber: acc.accountNumber,
        maskedAccountNumber: maskAccountNumber(acc.accountNumber),
        accountType: acc.accountType,
        status: acc.status,
        balancePaise: acc.balancePaise,
        balanceRupees: paiseToRupees(acc.balancePaise),
        formattedBalance: formatINR(acc.balancePaise),
        createdAt: acc.createdAt,
        user: acc.userId
          ? {
              id: acc.userId._id,
              name: acc.userId.name,
              email: acc.userId.email,
              phone: acc.userId.phone,
              role: acc.userId.role,
              isLocked: !!(acc.userId.lockUntil && acc.userId.lockUntil > Date.now()),
              failedLoginAttempts: acc.userId.failedLoginAttempts,
              lastLoginAt: acc.userId.lastLoginAt,
            }
          : null,
      })),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle / update account status (active, suspended, inactive)
 */
export const updateAccountStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!Object.values(ACCOUNT_STATUS).includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${Object.values(ACCOUNT_STATUS).join(', ')}`,
      });
    }

    const account = await BankAccount.findById(id).populate('userId', 'name email');
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found.',
      });
    }

    const previousStatus = account.status;
    account.status = status;
    await account.save();

    await logAudit({
      actorId: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: AUDIT_ACTIONS.ACCOUNT_STATUS_CHANGED,
      resourceType: 'BankAccount',
      resourceId: account._id.toString(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: {
        accountNumber: account.accountNumber,
        previousStatus,
        newStatus: status,
      },
      result: 'SUCCESS',
    });

    res.json({
      success: true,
      message: `Account ${account.accountNumber} status updated to ${status}.`,
      account: {
        id: account._id,
        accountNumber: account.accountNumber,
        status: account.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get security audit logs with filtering and pagination
 */
export const getAuditLogs = async (req, res, next) => {
  try {
    const { action, result, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (action) filter.action = action;
    if (result) filter.result = result;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [total, logs] = await Promise.all([
      AuditLog.countDocuments(filter),
      AuditLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    res.json({
      success: true,
      logs: logs.map((log) => ({
        id: log._id,
        action: log.action,
        actorEmail: log.actorEmail || 'System / Anonymous',
        actorRole: log.actorRole || 'N/A',
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        details: log.details,
        result: log.result,
        timestamp: log.timestamp,
      })),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};
