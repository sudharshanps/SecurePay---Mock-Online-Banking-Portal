export const CURRENCY = 'INR';
export const PAISE_PER_RUPEE = 100;

export const ACCOUNT_TYPES = {
  SAVINGS: 'savings',
  CURRENT: 'current',
};

export const ACCOUNT_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  INACTIVE: 'inactive',
};

export const USER_ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
};

export const TRANSFER_STATUS = {
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  PENDING: 'PENDING',
};

export const LEDGER_ENTRY_TYPES = {
  CREDIT: 'CREDIT',
  DEBIT: 'DEBIT',
};

export const AUDIT_ACTIONS = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  TRANSFER_SUCCESS: 'TRANSFER_SUCCESS',
  TRANSFER_FAILED: 'TRANSFER_FAILED',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  ACCOUNT_STATUS_CHANGED: 'ACCOUNT_STATUS_CHANGED',
  PROFILE_UPDATED: 'PROFILE_UPDATED',
  LOGOUT: 'LOGOUT',
};

// Default banking limits (in Paise)
export const DEFAULT_LIMITS = {
  MIN_TRANSFER_PAISE: 100, // ₹1.00
  MAX_TRANSFER_PAISE: 20000000, // ₹2,00,000.00
  INITIAL_DEMO_BALANCE_PAISE: 5000000, // ₹50,000.00
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 minutes
};

/**
 * Convert paise to decimal rupees
 * @param {number} paise
 * @returns {number}
 */
export const paiseToRupees = (paise) => {
  if (typeof paise !== 'number' || isNaN(paise)) return 0;
  return Number((paise / PAISE_PER_RUPEE).toFixed(2));
};

/**
 * Convert decimal rupees to integer paise
 * @param {number|string} rupees
 * @returns {number}
 */
export const rupeesToPaise = (rupees) => {
  const num = typeof rupees === 'string' ? parseFloat(rupees) : rupees;
  if (isNaN(num)) throw new Error('Invalid rupee amount');
  return Math.round(num * PAISE_PER_RUPEE);
};

/**
 * Format paise into Indian Rupee format (e.g. ₹1,25,000.50)
 * @param {number} paise
 * @returns {string}
 */
export const formatINR = (paise) => {
  const rupees = paiseToRupees(paise);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
};

/**
 * Mask account number showing only last 4 digits (e.g., •••• •••• 2001)
 * @param {string} accNum
 * @returns {string}
 */
export const maskAccountNumber = (accNum) => {
  if (!accNum) return '';
  const str = String(accNum);
  if (str.length <= 4) return str;
  const last4 = str.slice(-4);
  return `•••• •••• ${last4}`;
};
