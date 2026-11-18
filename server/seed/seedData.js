import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';
import BankAccount from '../models/BankAccount.js';
import Transfer from '../models/Transfer.js';
import LedgerEntry from '../models/LedgerEntry.js';
import AuditLog from '../models/AuditLog.js';
import {
  USER_ROLES,
  ACCOUNT_TYPES,
  ACCOUNT_STATUS,
  TRANSFER_STATUS,
  LEDGER_ENTRY_TYPES,
  AUDIT_ACTIONS,
  rupeesToPaise,
} from '../config/constants.js';

dotenv.config();

const DEMO_ADMIN = {
  name: 'TrustBank Security Administrator',
  email: 'admin@trustbank.local',
  password: 'Admin@TrustBank2026!',
  phone: '+919876500000',
  role: USER_ROLES.ADMIN,
};

const DEMO_CUSTOMERS = [
  {
    name: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    password: 'Customer@123456',
    phone: '+919876510001',
    accountNumber: '1001002001',
    accountType: ACCOUNT_TYPES.SAVINGS,
    initialBalanceRupees: 75000,
  },
  {
    name: 'Priya Patel',
    email: 'priya.patel@example.com',
    password: 'Customer@123456',
    phone: '+919876510002',
    accountNumber: '1001002002',
    accountType: ACCOUNT_TYPES.SAVINGS,
    initialBalanceRupees: 120000,
  },
  {
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@example.com',
    password: 'Customer@123456',
    phone: '+919876510003',
    accountNumber: '1001002003',
    accountType: ACCOUNT_TYPES.CURRENT,
    initialBalanceRupees: 250000,
  },
  {
    name: 'Ananya Iyer',
    email: 'ananya.iyer@example.com',
    password: 'Customer@123456',
    phone: '+919876510004',
    accountNumber: '1001002004',
    accountType: ACCOUNT_TYPES.SAVINGS,
    initialBalanceRupees: 45000,
  },
  {
    name: 'Vikram Malhotra',
    email: 'vikram.malhotra@example.com',
    password: 'Customer@123456',
    phone: '+919876510005',
    accountNumber: '1001002005',
    accountType: ACCOUNT_TYPES.CURRENT,
    initialBalanceRupees: 180000,
  },
  {
    name: 'Sneha Reddy',
    email: 'sneha.reddy@example.com',
    password: 'Customer@123456',
    phone: '+919876510006',
    accountNumber: '1001002006',
    accountType: ACCOUNT_TYPES.SAVINGS,
    initialBalanceRupees: 62000,
  },
  {
    name: 'Rohan Verma',
    email: 'rohan.verma@example.com',
    password: 'Customer@123456',
    phone: '+919876510007',
    accountNumber: '1001002007',
    accountType: ACCOUNT_TYPES.SAVINGS,
    initialBalanceRupees: 95000,
  },
  {
    name: 'Kavita Nair',
    email: 'kavita.nair@example.com',
    password: 'Customer@123456',
    phone: '+919876510008',
    accountNumber: '1001002008',
    accountType: ACCOUNT_TYPES.SAVINGS,
    initialBalanceRupees: 110000,
  },
  {
    name: 'Arjun Gupta',
    email: 'arjun.gupta@example.com',
    password: 'Customer@123456',
    phone: '+919876510009',
    accountNumber: '1001002009',
    accountType: ACCOUNT_TYPES.CURRENT,
    initialBalanceRupees: 310000,
  },
  {
    name: 'Divya Mehta',
    email: 'divya.mehta@example.com',
    password: 'Customer@123456',
    phone: '+919876510010',
    accountNumber: '1001002010',
    accountType: ACCOUNT_TYPES.SAVINGS,
    initialBalanceRupees: 55000,
  },
  {
    name: 'Sanjay Joshi',
    email: 'sanjay.joshi@example.com',
    password: 'Customer@123456',
    phone: '+919876510011',
    accountNumber: '1001002011',
    accountType: ACCOUNT_TYPES.SAVINGS,
    initialBalanceRupees: 88000,
  },
  {
    name: 'Meera Das',
    email: 'meera.das@example.com',
    password: 'Customer@123456',
    phone: '+919876510012',
    accountNumber: '1001002012',
    accountType: ACCOUNT_TYPES.SAVINGS,
    initialBalanceRupees: 72000,
  },
];

const SAMPLE_TRANSFER_DESCRIPTIONS = [
  'Monthly Apartment Rent',
  'Software Consulting Services',
  'Electricity Bill Payment - BESCOM',
  'Grocery & Supplies Reimbursement',
  'Medical Consultation Fee',
  'Broadband Internet Bill',
  'Gym & Fitness Subscription',
  'Dinner Split & Catering',
  'Freelance UI Design Work',
  'Bookstore Purchase',
  'Vehicle Insurance Premium',
  'Home Maintenance & Plumbing',
];

export const seedDatabase = async () => {
  console.log('[Seed] Starting database seeding process...');

  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    console.log('[Seed] Purging existing database collections...');
    await Promise.all([
      User.deleteMany({}),
      BankAccount.deleteMany({}),
      Transfer.deleteMany({}),
      LedgerEntry.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);
    console.log('[Seed] Existing records purged.');

    // 1. Create Admin
    const adminSalt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash(DEMO_ADMIN.password, adminSalt);
    const adminUser = await User.create({
      name: DEMO_ADMIN.name,
      email: DEMO_ADMIN.email,
      passwordHash: adminPasswordHash,
      phone: DEMO_ADMIN.phone,
      role: DEMO_ADMIN.role,
    });
    console.log(`[Seed] Created Administrator: ${adminUser.email}`);

    // 2. Create Customers & Bank Accounts
    const createdUsers = [];
    const createdAccounts = [];

    const defaultCustomerSalt = await bcrypt.genSalt(10);
    const defaultCustomerHash = await bcrypt.hash('Customer@123456', defaultCustomerSalt);

    for (const cust of DEMO_CUSTOMERS) {
      const user = await User.create({
        name: cust.name,
        email: cust.email,
        passwordHash: defaultCustomerHash,
        phone: cust.phone,
        role: USER_ROLES.CUSTOMER,
      });

      const initialBalancePaise = rupeesToPaise(cust.initialBalanceRupees);
      const account = await BankAccount.create({
        userId: user._id,
        accountNumber: cust.accountNumber,
        accountType: cust.accountType,
        balancePaise: initialBalancePaise,
        status: ACCOUNT_STATUS.ACTIVE,
      });

      createdUsers.push(user);
      createdAccounts.push(account);
    }
    console.log(`[Seed] Created ${createdUsers.length} demo customers and bank accounts.`);

    // 3. Create at least 35 realistic mock transactions between customers
    console.log('[Seed] Generating simulated transfer transactions and ledger entries...');
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    let transactionCount = 0;

    for (let i = 0; i < 36; i++) {
      // Pick random sender and recipient
      const senderIdx = i % createdAccounts.length;
      let recipientIdx = (i + 1 + Math.floor(Math.random() * (createdAccounts.length - 2))) % createdAccounts.length;
      if (recipientIdx === senderIdx) {
        recipientIdx = (senderIdx + 1) % createdAccounts.length;
      }

      const senderAcc = createdAccounts[senderIdx];
      const recipientAcc = createdAccounts[recipientIdx];
      const senderUser = createdUsers[senderIdx];
      const recipientUser = createdUsers[recipientIdx];

      // Transfer amounts between ₹500 and ₹12,000
      const amountRupees = 500 + (i * 320) % 11500;
      const amountPaise = rupeesToPaise(amountRupees);

      // Verify sender has sufficient funds
      if (senderAcc.balancePaise > amountPaise + 100000) {
        // Execute simulated transfer
        senderAcc.balancePaise -= amountPaise;
        recipientAcc.balancePaise += amountPaise;

        const dateOffsetDays = 35 - i;
        const txDate = new Date(now - dateOffsetDays * dayMs + (i * 3600000));
        const referenceId = `TXN-202611${String(10 + (i % 20)).padStart(2, '0')}-${Math.random().toString(16).slice(2, 10).toUpperCase()}`;
        const description = SAMPLE_TRANSFER_DESCRIPTIONS[i % SAMPLE_TRANSFER_DESCRIPTIONS.length];

        const transfer = await Transfer.create({
          senderAccountId: senderAcc._id,
          recipientAccountId: recipientAcc._id,
          senderUserId: senderUser._id,
          recipientUserId: recipientUser._id,
          amountPaise,
          referenceId,
          description,
          status: TRANSFER_STATUS.COMPLETED,
          createdAt: txDate,
        });

        // Debit Ledger Entry
        await LedgerEntry.create({
          accountId: senderAcc._id,
          userId: senderUser._id,
          transferId: transfer._id,
          entryType: LEDGER_ENTRY_TYPES.DEBIT,
          amountPaise,
          balanceAfterPaise: senderAcc.balancePaise,
          description,
          counterpartyAccountId: recipientAcc._id,
          counterpartyName: recipientUser.name,
          counterpartyAccountNumber: recipientAcc.accountNumber,
          createdAt: txDate,
        });

        // Credit Ledger Entry
        await LedgerEntry.create({
          accountId: recipientAcc._id,
          userId: recipientUser._id,
          transferId: transfer._id,
          entryType: LEDGER_ENTRY_TYPES.CREDIT,
          amountPaise,
          balanceAfterPaise: recipientAcc.balancePaise,
          description,
          counterpartyAccountId: senderAcc._id,
          counterpartyName: senderUser.name,
          counterpartyAccountNumber: senderAcc.accountNumber,
          createdAt: txDate,
        });

        transactionCount++;
      }
    }

    // Save final updated account balances
    for (const acc of createdAccounts) {
      await acc.save();
    }
    console.log(`[Seed] Generated ${transactionCount} completed fund transfers with ledger records.`);

    // 4. Create initial security audit logs
    await AuditLog.create([
      {
        action: AUDIT_ACTIONS.LOGIN_SUCCESS,
        actorEmail: DEMO_ADMIN.email,
        actorRole: USER_ROLES.ADMIN,
        resourceType: 'User',
        ipAddress: '127.0.0.1',
        details: { note: 'Initial system provisioning audit check' },
        result: 'SUCCESS',
      },
      {
        action: AUDIT_ACTIONS.TRANSFER_SUCCESS,
        actorEmail: createdUsers[0].email,
        actorRole: USER_ROLES.CUSTOMER,
        resourceType: 'Transfer',
        ipAddress: '127.0.0.1',
        details: { referenceId: 'TXN-INITIAL-0001', note: 'Seed simulation' },
        result: 'SUCCESS',
      },
    ]);
    console.log('[Seed] Created initial audit log entries.');

    console.log('\n========================================================');
    console.log(' SEEDING COMPLETE: TrustBank Digital Demo Environment');
    console.log('========================================================');
    console.log(' Admin Credentials:');
    console.log(`   Email:    ${DEMO_ADMIN.email}`);
    console.log(`   Password: ${DEMO_ADMIN.password}`);
    console.log('--------------------------------------------------------');
    console.log(' Demo Customer 1 (Primary Test):');
    console.log(`   Name:     ${DEMO_CUSTOMERS[0].name}`);
    console.log(`   Email:    ${DEMO_CUSTOMERS[0].email}`);
    console.log(`   Password: Customer@123456`);
    console.log(`   Account:  ${DEMO_CUSTOMERS[0].accountNumber}`);
    console.log(' Demo Customer 2:');
    console.log(`   Name:     ${DEMO_CUSTOMERS[1].name}`);
    console.log(`   Email:    ${DEMO_CUSTOMERS[1].email}`);
    console.log(`   Password: Customer@123456`);
    console.log(`   Account:  ${DEMO_CUSTOMERS[1].accountNumber}`);
    console.log('========================================================\n');

    return true;
  } catch (error) {
    console.error('[Seed] Database seeding failed:', error);
    throw error;
  }
};

// Execute if run directly
if (process.argv[1]?.endsWith('seedData.js')) {
  seedDatabase()
    .then(async () => {
      await disconnectDB();
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
