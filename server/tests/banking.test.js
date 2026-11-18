import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';
import BankAccount from '../models/BankAccount.js';
import Transfer from '../models/Transfer.js';
import LedgerEntry from '../models/LedgerEntry.js';
import { USER_ROLES, ACCOUNT_STATUS } from '../config/constants.js';

let customerAToken = '';
let customerBToken = '';
let adminToken = '';
let customerAAccount = null;
let customerBAccount = null;
let csrfTokenA = '';

beforeAll(async () => {
  await connectDB();
  await Promise.all([
    User.deleteMany({}),
    BankAccount.deleteMany({}),
    Transfer.deleteMany({}),
    LedgerEntry.deleteMany({}),
  ]);
}, 120000);

afterAll(async () => {
  await disconnectDB();
});

describe('1. Authentication & Account Creation', () => {
  it('should register Customer A successfully and create a linked BankAccount with ₹50,000 balance', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Aarav Sharma',
        email: 'aarav.test@trustbank.local',
        password: 'Password@123',
        phone: '+919876543210',
        accountType: 'savings',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('aarav.test@trustbank.local');
    expect(res.body.account).toBeDefined();
    expect(res.body.account.balancePaise).toBe(5000000); // ₹50,000 in paise
    expect(res.body.account.accountNumber).toMatch(/^1001\d{6}$/);

    customerAAccount = res.body.account;
  });

  it('should register Customer B successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Priya Patel',
        email: 'priya.test@trustbank.local',
        password: 'Password@123',
        phone: '+919876543211',
        accountType: 'current',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    customerBAccount = res.body.account;
  });

  it('should reject registration with duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Duplicate Aarav',
        email: 'aarav.test@trustbank.local',
        password: 'Password@123',
        phone: '+919876543210',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should reject login with invalid password and track attempts', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'aarav.test@trustbank.local',
        password: 'WrongPassword!999',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('remaining');
  });

  it('should login Customer A with valid credentials and return JWT cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'aarav.test@trustbank.local',
        password: 'Password@123',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.csrfToken).toBeDefined();
    csrfTokenA = res.body.csrfToken;

    const cookieHeader = res.headers['set-cookie'];
    expect(cookieHeader).toBeDefined();
    const tokenCookie = cookieHeader.find((c) => c.startsWith('securepay_token='));
    expect(tokenCookie).toBeDefined();
    customerAToken = tokenCookie.split(';')[0];
  });

  it('should login Customer B', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'priya.test@trustbank.local',
        password: 'Password@123',
      });

    expect(res.status).toBe(200);
    const cookieHeader = res.headers['set-cookie'];
    const tokenCookie = cookieHeader.find((c) => c.startsWith('securepay_token='));
    customerBToken = tokenCookie.split(';')[0];
  });
});

describe('2. Protected Routes & Authorization', () => {
  it('should reject unauthenticated request to /api/accounts/me with 401', async () => {
    const res = await request(app).get('/api/accounts/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should permit authenticated request to /api/accounts/me', async () => {
    const res = await request(app)
      .get('/api/accounts/me')
      .set('Cookie', [customerAToken]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.account.accountNumber).toBe(customerAAccount.accountNumber);
  });

  it('should reject non-admin access to admin dashboard with 403', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Cookie', [customerAToken]);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

describe('3. Recipient Verification & Mock Transfers', () => {
  it('should successfully verify an existing recipient account', async () => {
    const res = await request(app)
      .post('/api/transfers/verify-recipient')
      .set('Cookie', [customerAToken, `XSRF-TOKEN=${csrfTokenA}`])
      .set('x-csrf-token', csrfTokenA)
      .send({
        recipientAccountNumber: customerBAccount.accountNumber,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.recipientName).toBe('Priya Patel');
    expect(res.body.data.accountNumber).toBe(customerBAccount.accountNumber);
  });

  it('should reject self-transfer attempt', async () => {
    const res = await request(app)
      .post('/api/transfers/verify-recipient')
      .set('Cookie', [customerAToken, `XSRF-TOKEN=${csrfTokenA}`])
      .set('x-csrf-token', csrfTokenA)
      .send({
        recipientAccountNumber: customerAAccount.accountNumber,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('own account');
  });

  it('should reject transfer with insufficient funds', async () => {
    const res = await request(app)
      .post('/api/transfers')
      .set('Cookie', [customerAToken, `XSRF-TOKEN=${csrfTokenA}`])
      .set('x-csrf-token', csrfTokenA)
      .send({
        recipientAccountNumber: customerBAccount.accountNumber,
        amount: 70000, // Within ₹2,00,000 limit, but exceeds ₹50,000 balance
        description: 'Overdraft test',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Insufficient funds');
  });

  it('should successfully execute ₹5,000 mock transfer from Customer A to Customer B', async () => {
    const res = await request(app)
      .post('/api/transfers')
      .set('Cookie', [customerAToken, `XSRF-TOKEN=${csrfTokenA}`])
      .set('x-csrf-token', csrfTokenA)
      .set('idempotency-key', 'IDEMP-TEST-001')
      .send({
        recipientAccountNumber: customerBAccount.accountNumber,
        amount: 5000,
        description: 'Test transfer ₹5,000',
        idempotencyKey: 'IDEMP-TEST-001',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.receipt).toBeDefined();
    expect(res.body.receipt.referenceId).toMatch(/^TXN-\d{8}-[A-F0-9]{8}$/);
    expect(res.body.receipt.amountPaise).toBe(500000); // 5000 * 100 paise

    // Verify Sender A's balance is debited by ₹5,000 (50,000 - 5,000 = ₹45,000 = 4,500,000 paise)
    const updatedA = await BankAccount.findOne({ accountNumber: customerAAccount.accountNumber });
    expect(updatedA.balancePaise).toBe(4500000);

    // Verify Recipient B's balance is credited by ₹5,000 (50,000 + 5,000 = ₹55,000 = 5,500,000 paise)
    const updatedB = await BankAccount.findOne({ accountNumber: customerBAccount.accountNumber });
    expect(updatedB.balancePaise).toBe(5500000);

    // Verify Ledger Entries
    const ledgerDebit = await LedgerEntry.findOne({
      accountId: updatedA._id,
      entryType: 'DEBIT',
    });
    expect(ledgerDebit).toBeDefined();
    expect(ledgerDebit.balanceAfterPaise).toBe(4500000);

    const ledgerCredit = await LedgerEntry.findOne({
      accountId: updatedB._id,
      entryType: 'CREDIT',
    });
    expect(ledgerCredit).toBeDefined();
    expect(ledgerCredit.balanceAfterPaise).toBe(5500000);
  });

  it('should safely return existing receipt when same idempotency key is submitted (no double charge)', async () => {
    const initialA = await BankAccount.findOne({ accountNumber: customerAAccount.accountNumber });

    const res = await request(app)
      .post('/api/transfers')
      .set('Cookie', [customerAToken, `XSRF-TOKEN=${csrfTokenA}`])
      .set('x-csrf-token', csrfTokenA)
      .set('idempotency-key', 'IDEMP-TEST-001')
      .send({
        recipientAccountNumber: customerBAccount.accountNumber,
        amount: 5000,
        description: 'Duplicate retry attempt',
        idempotencyKey: 'IDEMP-TEST-001',
      });

    expect(res.status).toBe(200);
    expect(res.body.receipt).toBeDefined();

    // Verify balance was NOT debited a second time
    const afterA = await BankAccount.findOne({ accountNumber: customerAAccount.accountNumber });
    expect(afterA.balancePaise).toBe(initialA.balancePaise);
  });
});

describe('4. Transaction History & Account Statement', () => {
  it('should return paginated transaction history for Customer A', async () => {
    const res = await request(app)
      .get('/api/transactions')
      .set('Cookie', [customerAToken]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.transactions.length).toBeGreaterThan(0);
    expect(res.body.transactions[0].isDebit).toBe(true);
    expect(res.body.pagination.total).toBe(1);
  });

  it('should return accurate account statement for Customer A', async () => {
    const res = await request(app)
      .get('/api/transactions/statement')
      .set('Cookie', [customerAToken]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.statement.summary.totalDebitsPaise).toBe(500000);
    expect(res.body.statement.summary.closingBalancePaise).toBe(4500000);
    expect(res.body.statement.transactions.length).toBe(1);
  });
});

describe('5. Profile & Password Update', () => {
  it('should reject password change with incorrect current password', async () => {
    const res = await request(app)
      .put('/api/profile/password')
      .set('Cookie', [customerAToken, `XSRF-TOKEN=${csrfTokenA}`])
      .set('x-csrf-token', csrfTokenA)
      .send({
        currentPassword: 'WrongPassword!123',
        newPassword: 'BrandNewPassword@2026',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should successfully update password with valid current password', async () => {
    const res = await request(app)
      .put('/api/profile/password')
      .set('Cookie', [customerAToken, `XSRF-TOKEN=${csrfTokenA}`])
      .set('x-csrf-token', csrfTokenA)
      .send({
        currentPassword: 'Password@123',
        newPassword: 'BrandNewPassword@2026',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify login with new password succeeds
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'aarav.test@trustbank.local',
        password: 'BrandNewPassword@2026',
      });
    expect(loginRes.status).toBe(200);
  });
});
