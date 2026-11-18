import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import BankAccount from '../models/BankAccount.js';
import { ACCOUNT_STATUS } from '../config/constants.js';

export const authenticate = async (req, res, next) => {
  try {
    // Check for token in HTTP-only cookie first, then Bearer header
    let token = req.cookies?.securepay_token;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    const secret = process.env.JWT_SECRET || 'dev_super_secret_jwt_key_32_chars_long!';
    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Account no longer exists. Session invalid.',
      });
    }

    if (user.isLocked) {
      const waitMinutes = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      return res.status(403).json({
        success: false,
        message: `Account is temporarily locked due to repeated failed logins. Please try again in ${waitMinutes} minute(s).`,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid or forged authentication token.',
    });
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not possess the required permissions.',
      });
    }

    next();
  };
};

export const requireActiveAccount = async (req, res, next) => {
  try {
    const account = await BankAccount.findOne({ userId: req.user._id });
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'No bank account linked to this user profile.',
      });
    }

    if (account.status !== ACCOUNT_STATUS.ACTIVE) {
      return res.status(403).json({
        success: false,
        message: `Your account is currently ${account.status}. Transfers and debits are disabled.`,
      });
    }

    req.account = account;
    next();
  } catch (error) {
    next(error);
  }
};
