import mongoose from 'mongoose';
import { LEDGER_ENTRY_TYPES } from '../config/constants.js';

const ledgerEntrySchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BankAccount',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    transferId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transfer',
      required: true,
      index: true,
    },
    entryType: {
      type: String,
      enum: Object.values(LEDGER_ENTRY_TYPES),
      required: true,
    },
    amountPaise: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: 'Amount must be an integer (paise)',
      },
    },
    balanceAfterPaise: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: 'Balance after must be an integer (paise)',
      },
    },
    description: {
      type: String,
      trim: true,
    },
    counterpartyAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BankAccount',
    },
    counterpartyName: {
      type: String,
      trim: true,
    },
    counterpartyAccountNumber: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

ledgerEntrySchema.index({ accountId: 1, createdAt: -1 });
ledgerEntrySchema.index({ userId: 1, createdAt: -1 });

const LedgerEntry = mongoose.model('LedgerEntry', ledgerEntrySchema);
export default LedgerEntry;
