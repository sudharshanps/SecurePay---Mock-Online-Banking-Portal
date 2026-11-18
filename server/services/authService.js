import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import BankAccount from '../models/BankAccount.js';
import {
  USER_ROLES,
  ACCOUNT_TYPES,
  ACCOUNT_STATUS,
  DEFAULT_LIMITS,
  AUDIT_ACTIONS,
} from '../config/constants.js';
import { logAudit } from './auditService.js';

/**
 * Generate a random dummy 10-digit Indian bank account number
 */
export const generateAccountNumber = async () => {
  let unique = false;
  let accountNumber = '';

  while (!unique) {
    // Prefix 1001 + 6 random digits = 10 digits
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    accountNumber = `1001${randomSuffix}`;
    const existing = await BankAccount.findOne({ accountNumber });
    if (!existing) {
      unique = true;
    }
  }

  return accountNumber;
};

/**
 * Generate JWT token
 */
export const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'dev_super_secret_jwt_key_32_chars_long!';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    secret,
    { expiresIn }
  );
};

/**
 * Register a new customer
 */
export const registerCustomer = async ({
  name,
  email,
  password,
  phone,
  accountType = ACCOUNT_TYPES.SAVINGS,
  ipAddress,
  userAgent,
}) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error('An account with this email address already exists.');
    error.statusCode = 409;
    throw error;
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = new User({
    name,
    email,
    passwordHash,
    phone,
    role: USER_ROLES.CUSTOMER,
  });
  await user.save();

  const accountNumber = await generateAccountNumber();
  const initialBalance = Number(process.env.INITIAL_DEMO_BALANCE_PAISE) || DEFAULT_LIMITS.INITIAL_DEMO_BALANCE_PAISE;

  const bankAccount = new BankAccount({
    userId: user._id,
    accountNumber,
    accountType,
    balancePaise: initialBalance,
    status: ACCOUNT_STATUS.ACTIVE,
  });
  await bankAccount.save();

  await logAudit({
    actorId: user._id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'REGISTER_CUSTOMER',
    resourceType: 'User',
    resourceId: user._id.toString(),
    ipAddress,
    userAgent,
    details: { accountNumber, accountType, initialBalancePaise: initialBalance },
    result: 'SUCCESS',
  });

  const token = generateToken(user);

  return {
    user: user.toJSON(),
    account: bankAccount.toJSON(),
    token,
  };
};

/**
 * Login user with rate limiting and account lockout
 */
export const login = async ({ email, password, ipAddress, userAgent }) => {
  const user = await User.findOne({ email });

  if (!user) {
    await logAudit({
      actorEmail: email,
      action: AUDIT_ACTIONS.LOGIN_FAILURE,
      resourceType: 'User',
      ipAddress,
      userAgent,
      details: { reason: 'User not found' },
      result: 'FAILURE',
    });
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  // Check if locked
  if (user.isLocked) {
    const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
    await logAudit({
      actorId: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      action: AUDIT_ACTIONS.LOGIN_FAILURE,
      resourceType: 'User',
      resourceId: user._id.toString(),
      ipAddress,
      userAgent,
      details: { reason: 'Account locked', remainingMinutes },
      result: 'FAILURE',
    });
    const error = new Error(`Account is locked due to multiple failed login attempts. Try again in ${remainingMinutes} minute(s).`);
    error.statusCode = 403;
    throw error;
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    user.failedLoginAttempts += 1;
    let locked = false;

    if (user.failedLoginAttempts >= DEFAULT_LIMITS.MAX_LOGIN_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + DEFAULT_LIMITS.LOCKOUT_DURATION_MS);
      locked = true;

      await logAudit({
        actorId: user._id,
        actorEmail: user.email,
        actorRole: user.role,
        action: AUDIT_ACTIONS.ACCOUNT_LOCKED,
        resourceType: 'User',
        resourceId: user._id.toString(),
        ipAddress,
        userAgent,
        details: { failedAttempts: user.failedLoginAttempts, lockDurationMs: DEFAULT_LIMITS.LOCKOUT_DURATION_MS },
        result: 'WARNING',
      });
    }

    await user.save();

    await logAudit({
      actorId: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      action: AUDIT_ACTIONS.LOGIN_FAILURE,
      resourceType: 'User',
      resourceId: user._id.toString(),
      ipAddress,
      userAgent,
      details: { failedAttempts: user.failedLoginAttempts },
      result: 'FAILURE',
    });

    if (locked) {
      const error = new Error('Account locked for 15 minutes due to 5 consecutive failed attempts.');
      error.statusCode = 403;
      throw error;
    }

    const attemptsLeft = DEFAULT_LIMITS.MAX_LOGIN_ATTEMPTS - user.failedLoginAttempts;
    const error = new Error(`Invalid email or password. ${attemptsLeft} attempt(s) remaining before temporary lockout.`);
    error.statusCode = 401;
    throw error;
  }

  // Successful login: reset failed attempts
  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  user.lastLoginAt = new Date();
  await user.save();

  const account = await BankAccount.findOne({ userId: user._id });

  await logAudit({
    actorId: user._id,
    actorEmail: user.email,
    actorRole: user.role,
    action: AUDIT_ACTIONS.LOGIN_SUCCESS,
    resourceType: 'User',
    resourceId: user._id.toString(),
    ipAddress,
    userAgent,
    details: { accountId: account?._id },
    result: 'SUCCESS',
  });

  const token = generateToken(user);

  return {
    user: user.toJSON(),
    account: account ? account.toJSON() : null,
    token,
  };
};
