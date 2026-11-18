import mongoose from 'mongoose';
import { ACCOUNT_TYPES, ACCOUNT_STATUS, CURRENCY } from '../config/constants.js';

const bankAccountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    accountNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    accountType: {
      type: String,
      enum: Object.values(ACCOUNT_TYPES),
      default: ACCOUNT_TYPES.SAVINGS,
    },
    balancePaise: {
      type: Number,
      required: true,
      default: 5000000, // ₹50,000.00
      min: [0, 'Account balance cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'Balance in paise must be an integer',
      },
    },
    currency: {
      type: String,
      default: CURRENCY,
    },
    status: {
      type: String,
      enum: Object.values(ACCOUNT_STATUS),
      default: ACCOUNT_STATUS.ACTIVE,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

bankAccountSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const BankAccount = mongoose.model('BankAccount', bankAccountSchema);
export default BankAccount;
