import mongoose from 'mongoose';
import crypto from 'crypto';
import BankAccount from '../models/BankAccount.js';
import User from '../models/User.js';
import Transfer from '../models/Transfer.js';
import LedgerEntry from '../models/LedgerEntry.js';
import {
  ACCOUNT_STATUS,
  TRANSFER_STATUS,
  LEDGER_ENTRY_TYPES,
  DEFAULT_LIMITS,
  AUDIT_ACTIONS,
  rupeesToPaise,
  paiseToRupees,
  formatINR,
  maskAccountNumber,
} from '../config/constants.js';
import { logAudit } from './auditService.js';
import { checkReplicaSetSupport } from '../config/db.js';

/**
 * Generate a unique banking transaction reference ID
 * Format: TXN-YYYYMMDD-XXXXXXXX
 */
export const generateReferenceId = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `TXN-${dateStr}-${randomHex}`;
};

/**
 * Verify a recipient account exists, is active, and is not the sender's own account
 */
export const verifyRecipient = async (recipientAccountNumber, senderUserId) => {
  if (!recipientAccountNumber) {
    const error = new Error('Recipient account number is required.');
    error.statusCode = 400;
    throw error;
  }

  const recipientAccount = await BankAccount.findOne({
    accountNumber: recipientAccountNumber.trim(),
  }).populate('userId', 'name email');

  if (!recipientAccount) {
    const error = new Error('Recipient account number not found. Please verify and try again.');
    error.statusCode = 404;
    throw error;
  }

  if (recipientAccount.userId._id.toString() === senderUserId.toString()) {
    const error = new Error('Cannot transfer funds to your own account.');
    error.statusCode = 400;
    throw error;
  }

  if (recipientAccount.status !== ACCOUNT_STATUS.ACTIVE) {
    const error = new Error(`Recipient account is currently ${recipientAccount.status} and cannot receive transfers.`);
    error.statusCode = 400;
    throw error;
  }

  return {
    valid: true,
    recipientAccountId: recipientAccount._id,
    recipientName: recipientAccount.userId.name,
    accountNumber: recipientAccount.accountNumber,
    maskedAccountNumber: maskAccountNumber(recipientAccount.accountNumber),
    accountType: recipientAccount.accountType,
  };
};

/**
 * Execute mock fund transfer with atomic conditional balance updates,
 * idempotency key checking, and ledger entry creation.
 */
export const executeTransfer = async ({
  senderUserId,
  recipientAccountNumber,
  amount,
  description = 'Mock Fund Transfer',
  idempotencyKey = null,
  ipAddress = null,
  userAgent = null,
}) => {
  // Convert amount to integer paise
  const amountPaise = rupeesToPaise(amount);

  // Validate limits
  const minLimit = Number(process.env.MIN_TRANSFER_PAISE) || DEFAULT_LIMITS.MIN_TRANSFER_PAISE;
  const maxLimit = Number(process.env.MAX_TRANSFER_PAISE) || DEFAULT_LIMITS.MAX_TRANSFER_PAISE;

  if (amountPaise < minLimit) {
    const error = new Error(`Minimum transfer amount is ${formatINR(minLimit)}.`);
    error.statusCode = 400;
    throw error;
  }

  if (amountPaise > maxLimit) {
    const error = new Error(`Maximum transfer amount per transaction is ${formatINR(maxLimit)}.`);
    error.statusCode = 400;
    throw error;
  }

  // Find sender account
  const senderAccount = await BankAccount.findOne({ userId: senderUserId }).populate('userId', 'name email');
  if (!senderAccount) {
    const error = new Error('Sender bank account not found.');
    error.statusCode = 404;
    throw error;
  }

  if (senderAccount.status !== ACCOUNT_STATUS.ACTIVE) {
    const error = new Error(`Your account is currently ${senderAccount.status}. Transfers are disabled.`);
    error.statusCode = 403;
    throw error;
  }

  // Find recipient account
  const recipientAccount = await BankAccount.findOne({
    accountNumber: recipientAccountNumber.trim(),
  }).populate('userId', 'name email');

  if (!recipientAccount) {
    const error = new Error('Recipient account does not exist.');
    error.statusCode = 404;
    throw error;
  }

  if (recipientAccount._id.toString() === senderAccount._id.toString()) {
    const error = new Error('Cannot transfer funds to the same account.');
    error.statusCode = 400;
    throw error;
  }

  if (recipientAccount.status !== ACCOUNT_STATUS.ACTIVE) {
    const error = new Error(`Recipient account is ${recipientAccount.status} and cannot receive funds.`);
    error.statusCode = 400;
    throw error;
  }

  // Check available balance before proceeding
  if (senderAccount.balancePaise < amountPaise) {
    const error = new Error(
      `Insufficient funds. Available balance: ${formatINR(senderAccount.balancePaise)}, Requested: ${formatINR(amountPaise)}.`
    );
    error.statusCode = 400;
    throw error;
  }

  // Idempotency check: if transfer already exists with this idempotency key for this sender, return it
  if (idempotencyKey) {
    const existingTransfer = await Transfer.findOne({
      idempotencyKey: idempotencyKey.trim(),
      senderAccountId: senderAccount._id,
    });
    if (existingTransfer) {
      console.log(`[Transfer] Idempotency match found for key: ${idempotencyKey}. Returning existing receipt.`);
      return formatTransferReceipt(existingTransfer, senderAccount, recipientAccount);
    }
  }

  const referenceId = generateReferenceId();
  const supportsReplicaSet = checkReplicaSetSupport();

  let transferRecord = null;
  let senderBalanceAfter = 0;
  let recipientBalanceAfter = 0;

  if (supportsReplicaSet) {
    // Standard banking atomic transaction with MongoDB session
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Conditional atomic decrement of sender balance
      const updatedSender = await BankAccount.findOneAndUpdate(
        {
          _id: senderAccount._id,
          balancePaise: { $gte: amountPaise },
          status: ACCOUNT_STATUS.ACTIVE,
        },
        { $inc: { balancePaise: -amountPaise } },
        { session, new: true }
      );

      if (!updatedSender) {
        throw new Error('Transfer aborted: Insufficient funds or account state changed during processing.');
      }
      senderBalanceAfter = updatedSender.balancePaise;

      // 2. Atomic increment of recipient balance
      const updatedRecipient = await BankAccount.findOneAndUpdate(
        {
          _id: recipientAccount._id,
          status: ACCOUNT_STATUS.ACTIVE,
        },
        { $inc: { balancePaise: amountPaise } },
        { session, new: true }
      );

      if (!updatedRecipient) {
        throw new Error('Transfer aborted: Recipient account is inactive or not eligible to receive funds.');
      }
      recipientBalanceAfter = updatedRecipient.balancePaise;

      // 3. Create Transfer record
      const [newTransfer] = await Transfer.create(
        [
          {
            senderAccountId: senderAccount._id,
            recipientAccountId: recipientAccount._id,
            senderUserId: senderAccount.userId._id,
            recipientUserId: recipientAccount.userId._id,
            amountPaise,
            referenceId,
            idempotencyKey: idempotencyKey ? idempotencyKey.trim() : null,
            description,
            status: TRANSFER_STATUS.COMPLETED,
          },
        ],
        { session, ordered: true }
      );
      transferRecord = newTransfer;

      // 4. Create Ledger Entries (Debit for sender, Credit for recipient)
      await LedgerEntry.create(
        [
          {
            accountId: senderAccount._id,
            userId: senderAccount.userId._id,
            transferId: newTransfer._id,
            entryType: LEDGER_ENTRY_TYPES.DEBIT,
            amountPaise,
            balanceAfterPaise: senderBalanceAfter,
            description,
            counterpartyAccountId: recipientAccount._id,
            counterpartyName: recipientAccount.userId.name,
            counterpartyAccountNumber: recipientAccount.accountNumber,
          },
          {
            accountId: recipientAccount._id,
            userId: recipientAccount.userId._id,
            transferId: newTransfer._id,
            entryType: LEDGER_ENTRY_TYPES.CREDIT,
            amountPaise,
            balanceAfterPaise: recipientBalanceAfter,
            description,
            counterpartyAccountId: senderAccount._id,
            counterpartyName: senderAccount.userId.name,
            counterpartyAccountNumber: senderAccount.accountNumber,
          },
        ],
        { session, ordered: true }
      );

      // Commit entire transaction
      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      await logAudit({
        actorId: senderUserId,
        actorEmail: senderAccount.userId.email,
        action: AUDIT_ACTIONS.TRANSFER_FAILED,
        resourceType: 'Transfer',
        ipAddress,
        userAgent,
        details: { referenceId, amountPaise, error: err.message },
        result: 'FAILURE',
      });
      const error = new Error(err.message || 'Transfer failed due to a database transaction error.');
      error.statusCode = 400;
      throw error;
    } finally {
      await session.endSession();
    }
  } else {
    // Standalone fallback: conditional atomic update with rollback on failure
    try {
      // 1. Conditional decrement
      const updatedSender = await BankAccount.findOneAndUpdate(
        {
          _id: senderAccount._id,
          balancePaise: { $gte: amountPaise },
          status: ACCOUNT_STATUS.ACTIVE,
        },
        { $inc: { balancePaise: -amountPaise } },
        { new: true }
      );

      if (!updatedSender) {
        throw new Error('Transfer aborted: Insufficient funds or account state changed.');
      }
      senderBalanceAfter = updatedSender.balancePaise;

      try {
        // 2. Increment recipient
        const updatedRecipient = await BankAccount.findOneAndUpdate(
          {
            _id: recipientAccount._id,
            status: ACCOUNT_STATUS.ACTIVE,
          },
          { $inc: { balancePaise: amountPaise } },
          { new: true }
        );

        if (!updatedRecipient) {
          throw new Error('Recipient account is not active or could not be credited.');
        }
        recipientBalanceAfter = updatedRecipient.balancePaise;

        // 3. Create Transfer record
        transferRecord = await Transfer.create({
          senderAccountId: senderAccount._id,
          recipientAccountId: recipientAccount._id,
          senderUserId: senderAccount.userId._id,
          recipientUserId: recipientAccount.userId._id,
          amountPaise,
          referenceId,
          idempotencyKey: idempotencyKey ? idempotencyKey.trim() : null,
          description,
          status: TRANSFER_STATUS.COMPLETED,
        });

        // 4. Create Ledger Entries
        await LedgerEntry.create([
          {
            accountId: senderAccount._id,
            userId: senderAccount.userId._id,
            transferId: transferRecord._id,
            entryType: LEDGER_ENTRY_TYPES.DEBIT,
            amountPaise,
            balanceAfterPaise: senderBalanceAfter,
            description,
            counterpartyAccountId: recipientAccount._id,
            counterpartyName: recipientAccount.userId.name,
            counterpartyAccountNumber: recipientAccount.accountNumber,
          },
          {
            accountId: recipientAccount._id,
            userId: recipientAccount.userId._id,
            transferId: transferRecord._id,
            entryType: LEDGER_ENTRY_TYPES.CREDIT,
            amountPaise,
            balanceAfterPaise: recipientBalanceAfter,
            description,
            counterpartyAccountId: senderAccount._id,
            counterpartyName: senderAccount.userId.name,
            counterpartyAccountNumber: senderAccount.accountNumber,
          },
        ]);
      } catch (innerErr) {
        // Rollback sender debit
        await BankAccount.findByIdAndUpdate(senderAccount._id, {
          $inc: { balancePaise: amountPaise },
        });
        throw innerErr;
      }
    } catch (err) {
      await logAudit({
        actorId: senderUserId,
        actorEmail: senderAccount.userId.email,
        action: AUDIT_ACTIONS.TRANSFER_FAILED,
        resourceType: 'Transfer',
        ipAddress,
        userAgent,
        details: { referenceId, amountPaise, error: err.message },
        result: 'FAILURE',
      });
      const error = new Error(err.message || 'Transfer failed.');
      error.statusCode = 400;
      throw error;
    }
  }

  // Audit log of successful transfer
  await logAudit({
    actorId: senderUserId,
    actorEmail: senderAccount.userId.email,
    actorRole: senderAccount.userId.role,
    action: AUDIT_ACTIONS.TRANSFER_SUCCESS,
    resourceType: 'Transfer',
    resourceId: transferRecord._id.toString(),
    ipAddress,
    userAgent,
    details: {
      referenceId,
      amountPaise,
      senderAccountId: senderAccount._id,
      recipientAccountId: recipientAccount._id,
      senderBalanceAfter,
      recipientBalanceAfter,
    },
    result: 'SUCCESS',
  });

  return formatTransferReceipt(transferRecord, senderAccount, recipientAccount, senderBalanceAfter);
};

/**
 * Format a transfer confirmation receipt
 */
const formatTransferReceipt = (transfer, senderAccount, recipientAccount, senderBalanceAfter = null) => {
  return {
    transferId: transfer._id,
    referenceId: transfer.referenceId,
    status: transfer.status,
    timestamp: transfer.createdAt || new Date(),
    amountPaise: transfer.amountPaise,
    amountRupees: paiseToRupees(transfer.amountPaise),
    formattedAmount: formatINR(transfer.amountPaise),
    description: transfer.description,
    sender: {
      name: senderAccount.userId?.name || 'Account Holder',
      accountNumber: senderAccount.accountNumber,
      maskedAccountNumber: maskAccountNumber(senderAccount.accountNumber),
      ...(senderBalanceAfter !== null && {
        balanceAfterPaise: senderBalanceAfter,
        formattedBalanceAfter: formatINR(senderBalanceAfter),
      }),
    },
    recipient: {
      name: recipientAccount.userId?.name || 'Recipient',
      accountNumber: recipientAccount.accountNumber,
      maskedAccountNumber: maskAccountNumber(recipientAccount.accountNumber),
    },
  };
};

/**
 * Get transfer receipt by ID
 */
export const getTransferReceipt = async (transferId, userId) => {
  const transfer = await Transfer.findById(transferId)
    .populate({
      path: 'senderAccountId',
      populate: { path: 'userId', select: 'name email' },
    })
    .populate({
      path: 'recipientAccountId',
      populate: { path: 'userId', select: 'name email' },
    });

  if (!transfer) {
    const error = new Error('Transfer receipt not found.');
    error.statusCode = 404;
    throw error;
  }

  // Ensure user owns either sender or recipient side of transfer
  const isSender = transfer.senderUserId.toString() === userId.toString();
  const isRecipient = transfer.recipientUserId.toString() === userId.toString();

  if (!isSender && !isRecipient) {
    const error = new Error('You are not authorized to view this transfer receipt.');
    error.statusCode = 403;
    throw error;
  }

  // Find user's ledger entry for resulting balance
  const ledger = await LedgerEntry.findOne({
    transferId: transfer._id,
    userId,
  });

  return {
    transferId: transfer._id,
    referenceId: transfer.referenceId,
    status: transfer.status,
    timestamp: transfer.createdAt,
    amountPaise: transfer.amountPaise,
    amountRupees: paiseToRupees(transfer.amountPaise),
    formattedAmount: formatINR(transfer.amountPaise),
    description: transfer.description,
    userRoleInTransfer: isSender ? 'SENDER' : 'RECIPIENT',
    balanceAfterPaise: ledger?.balanceAfterPaise || null,
    formattedBalanceAfter: ledger?.balanceAfterPaise ? formatINR(ledger.balanceAfterPaise) : null,
    sender: {
      name: transfer.senderAccountId?.userId?.name || 'Sender',
      accountNumber: transfer.senderAccountId?.accountNumber,
      maskedAccountNumber: maskAccountNumber(transfer.senderAccountId?.accountNumber),
    },
    recipient: {
      name: transfer.recipientAccountId?.userId?.name || 'Recipient',
      accountNumber: transfer.recipientAccountId?.accountNumber,
      maskedAccountNumber: maskAccountNumber(transfer.recipientAccountId?.accountNumber),
    },
  };
};
