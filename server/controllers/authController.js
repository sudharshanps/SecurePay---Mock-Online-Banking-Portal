import {
  registerCustomer,
  login as loginService,
  generateToken,
} from '../services/authService.js';
import { generateCsrfToken, setCsrfCookie } from '../middleware/csrf.js';
import { logAudit } from '../services/auditService.js';
import BankAccount from '../models/BankAccount.js';
import { maskAccountNumber, formatINR, paiseToRupees } from '../config/constants.js';

const setAuthCookie = (res, token) => {
  res.cookie('securepay_token', token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: process.env.COOKIE_SAME_SITE || 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, accountType } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];

    const result = await registerCustomer({
      name,
      email,
      password,
      phone,
      accountType,
      ipAddress,
      userAgent,
    });

    setAuthCookie(res, result.token);

    const csrfToken = generateCsrfToken();
    setCsrfCookie(res, csrfToken);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully. Welcome to TrustBank Digital!',
      user: result.user,
      account: {
        ...result.account,
        maskedAccountNumber: maskAccountNumber(result.account.accountNumber),
        formattedBalance: formatINR(result.account.balancePaise),
        balanceRupees: paiseToRupees(result.account.balancePaise),
      },
      csrfToken,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];

    const result = await loginService({
      email,
      password,
      ipAddress,
      userAgent,
    });

    setAuthCookie(res, result.token);

    const csrfToken = generateCsrfToken();
    setCsrfCookie(res, csrfToken);

    res.json({
      success: true,
      message: 'Authentication successful.',
      user: result.user,
      account: result.account
        ? {
            ...result.account,
            maskedAccountNumber: maskAccountNumber(result.account.accountNumber),
            formattedBalance: formatINR(result.account.balancePaise),
            balanceRupees: paiseToRupees(result.account.balancePaise),
          }
        : null,
      csrfToken,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await logAudit({
        actorId: req.user._id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        action: 'LOGOUT',
        resourceType: 'User',
        resourceId: req.user._id.toString(),
        ipAddress: req.ip || req.headers['x-forwarded-for'],
        userAgent: req.headers['user-agent'],
        result: 'SUCCESS',
      });
    }

    res.clearCookie('securepay_token', { path: '/' });
    res.clearCookie('XSRF-TOKEN', { path: '/' });

    res.json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const account = await BankAccount.findOne({ userId: req.user._id });
    const csrfToken = generateCsrfToken();
    setCsrfCookie(res, csrfToken);

    res.json({
      success: true,
      user: req.user.toJSON(),
      account: account
        ? {
            ...account.toJSON(),
            maskedAccountNumber: maskAccountNumber(account.accountNumber),
            formattedBalance: formatINR(account.balancePaise),
            balanceRupees: paiseToRupees(account.balancePaise),
          }
        : null,
      csrfToken,
    });
  } catch (error) {
    next(error);
  }
};

export const getCsrfToken = async (req, res) => {
  const token = generateCsrfToken();
  setCsrfCookie(res, token);
  res.json({
    success: true,
    csrfToken: token,
  });
};
