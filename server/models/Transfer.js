import mongoose from 'mongoose';
import { TRANSFER_STATUS } from '../config/constants.js';

const transferSchema = new mongoose.Schema(
  {
    senderAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BankAccount',
      required: true,
      index: true,
    },
    recipientAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BankAccount',
      required: true,
      index: true,
    },
    senderUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amountPaise: {
      type: Number,
      required: true,
      min: [1, 'Transfer amount must be at least 1 paise'],
      validate: {
        validator: Number.isInteger,
        message: 'Amount must be an integer (paise)',
      },
    },
    referenceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      index: true,
      trim: true,
    },
    description: {
      type: String,
      default: 'Fund Transfer',
      trim: true,
      maxlength: 200,
    },
    status: {
      type: String,
      enum: Object.values(TRANSFER_STATUS),
      default: TRANSFER_STATUS.PENDING,
      index: true,
    },
    failureReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

transferSchema.index({ senderAccountId: 1, createdAt: -1 });
transferSchema.index({ recipientAccountId: 1, createdAt: -1 });

const Transfer = mongoose.model('Transfer', transferSchema);
export default Transfer;
