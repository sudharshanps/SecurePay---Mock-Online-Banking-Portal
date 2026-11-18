# SecurePay — Mock Online Banking Portal
### TrustBank Digital — Advanced Fintech & Banking Simulation Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Tests](https://img.shields.io/badge/tests-18%20passed%20%2F%2018-success.svg)]()
[![Security](https://img.shields.io/badge/security-Helmet%20%7C%20JWT%20%7C%20CSRF%20%7C%20Bcrypt-blue.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()

> **CRITICAL DISCLAIMER: DEMO BANKING SIMULATION ONLY**  
> **SecurePay** is an educational and technical demonstration portal developed for **TrustBank Digital**. All account numbers, balances, financial transfers, and ledger entries are completely fictional. Balances are tracked as integer paise for simulation only. **No real banking networks, UPI gateways, card networks, or real money transactions are involved.**

---

## 📑 Table of Contents

1. [Project Overview](#-project-overview)
2. [Key Features](#-key-features)
3. [Architecture & Tech Stack](#-architecture--tech-stack)
4. [Folder Structure](#-folder-structure)
5. [Cybersecurity & Financial Integrity](#-cybersecurity--financial-integrity)
6. [Prerequisites & Environment Setup](#-prerequisites--environment-setup)
7. [Installation & Quick Start](#-installation--quick-start)
8. [Database Seeding & Demo Credentials](#-database-seeding--demo-credentials)
9. [REST API Documentation](#-rest-api-documentation)
10. [Automated Testing & Results](#-automated-testing--results)
11. [Screenshots](#-screenshots)
12. [HTTPS & Production Deployment Guidelines](#-https--production-deployment-guidelines)
13. [Known Limitations & Future Roadmap](#-known-limitations--future-roadmap)

---

## 🏦 Project Overview

**SecurePay** is an enterprise-grade mock online banking web portal built for **TrustBank Digital**. Engineered to replicate real-world core banking principles, SecurePay enforces strict financial ledger accounting, atomic two-phase commit fund transfers, multi-tier cybersecurity protections, and responsive user experiences.

### Key Milestones:
- **Currency**: Indian Rupees (₹)
- **Financial Precision**: Balances stored exclusively as **integer paise** (1 INR = 100 paise) to prevent IEEE 754 floating-point rounding errors.
- **Transaction Guarantee**: MongoDB multi-document sessions and ACID transactions to ensure zero funds are created or destroyed during transfers.
- **Defense in Depth**: HTTP-only Secure SameSite cookies, CSRF Double Submit token verification, Zod input validation, Helmet headers, IP rate limiting, and brute-force account lockout.

---

## 🚀 Key Features

### 1. Modern Digital Banking UI/UX
- Navy Blue (`#0F2038`), White (`#F8FAFC`), and Teal/Blue accents.
- Responsive sidebar navigation with collapsible mobile drawer.
- Interactive SVG Income & Expense overview chart (6-month comparative credits vs. debits).
- Lucide React icon suite.
- Accessible, keyboard-friendly forms and clear validation feedback.

### 2. Authentication & Authorization
- Customer registration with instant provision of a simulated bank account loaded with ₹50,000 demo funds.
- Secure login using bcrypt password hashing (12 salt rounds).
- HTTP-Only, Secure, SameSite cookies for JWT storage (no JWTs in `localStorage`).
- Account lockout cooldown (locks account for 15 minutes after 5 consecutive failed attempts).
- Role-based authorization (`customer` vs `admin`).
- Active session verification with CSRF header synchronization.

### 3. Customer Dashboard
- Personalized greeting and masked account number display.
- Real-time MongoDB balance cards: Available Balance, Total Money Credited, Total Money Debited.
- Quick Actions bar: Quick Transfer, View Transactions, Account Specifications.
- 5 most recent ledger movements with one-click receipt inspection.

### 4. Mock Fund Transfer System
- 3-step verified transfer flow:
  1. **Beneficiary Verification**: Validates account exists, is active, and is not the sender's own account.
  2. **Amount & Purpose**: Configurable single transfer limits (₹1.00 min to ₹2,00,000.00 max) with quick increment chips (+₹500, +₹1,000, +₹5,000, +₹10,000).
  3. **Review & Confirmation**: Pre-execution preview with balance deduction estimation.
- **Atomic Two-Phase Updates**: Uses MongoDB sessions and transactions to simultaneously debit the sender and credit the beneficiary.
- **Idempotency Protection**: Client passes `Idempotency-Key` header to eliminate duplicate debit charges on network retries.
- **Receipt Modal & PDF**: Generates downloadable PDF receipts via `jsPDF` and `jspdf-autotable`.

### 5. Transaction History & Filtering
- Search by description, beneficiary name, or counterparty account number.
- Filter by transaction type: All, Credits Only (+), Debits Only (-).
- Filter by date range (Start Date and End Date).
- Pagination controls with total record metrics.
- One-click receipt view and PDF download for every ledger entry.

### 6. Official Account Statement
- Flexible periods: Last 30 Days, Last 90 Days, Last 6 Months, or Custom Date Range.
- Financial metrics: Opening Balance, Total Deposits (+), Total Debits (-), and Closing Balance.
- Itemized chronological ledger table.
- **Export Options**: Download official PDF statement or export raw CSV data.

### 7. Profile & Security Center
- View and update contact information (Name, Email, Phone Number).
- Secure password change requiring validation of the current password and complexity enforcement.
- Linked bank account status and balance overview.
- Single-click session termination (Logout).

### 8. Administrator Oversight Portal
- System liquidity aggregation: Total customers, active accounts, completed transactions, and aggregate simulated vault balances.
- Customer account search and status toggling (Instant suspend / reactivate).
- Comprehensive security audit log viewer (logs login attempts, lockouts, status updates, and fund transfers).

---

## 🛠 Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Layer                          │
│     React 18  •  Vite  •  Tailwind CSS  •  Lucide Icons     │
└──────────────────────────────┬──────────────────────────────┘
                               │  REST API (Credentials & CSRF)
┌──────────────────────────────▼──────────────────────────────┐
│                    API & Security Gateway                   │
│  Express 4  •  Helmet  •  CORS  •  Rate Limiter  •  CSRF    │
└──────────────────────────────┬──────────────────────────────┘
                               │  Middleware & Controllers
┌──────────────────────────────▼──────────────────────────────┐
│                       Services Layer                        │
│   AuthService  •  TransferService  •  TransactionService    │
└──────────────────────────────┬──────────────────────────────┘
                               │  Mongoose ODM (ACID Transactions)
┌──────────────────────────────▼──────────────────────────────┐
│                       Database Layer                        │
│     MongoDB (Replica Set / Atlas / MongoMemoryReplSet)      │
└─────────────────────────────────────────────────────────────┘
```

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, Lucide React, jsPDF, jspdf-autotable |
| **Backend** | Node.js (v24), Express.js, Helmet, Cookie-Parser, Morgan, Express-Rate-Limit, Zod |
| **Database** | MongoDB with Mongoose ODM (Sessions, Transactions & In-Memory Replica Set) |
| **Authentication** | JWT (JSON Web Tokens) in HTTP-Only cookies, bcryptjs (12 salt rounds) |
| **Testing** | Vitest, Supertest, MongoMemoryReplSet |

---

## 📂 Folder Structure

```text
SecurePay---Mock-Online-Banking-Portal/
├── client/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── DemoBanner.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── MonthlyChart.jsx
│   │   │   ├── QuickActions.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── StatCard.jsx
│   │   │   ├── TransactionTable.jsx
│   │   │   └── TransferReceiptModal.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   │   └── useAuth.js
│   │   ├── pages/
│   │   │   ├── AccountDetailsPage.jsx
│   │   │   ├── AccountStatementPage.jsx
│   │   │   ├── AdminDashboardPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── NotFoundPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── TransactionsPage.jsx
│   │   │   └── TransferMoneyPage.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── pdfService.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/
│   ├── config/
│   │   ├── constants.js
│   │   └── db.js
│   ├── controllers/
│   │   ├── accountController.js
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── profileController.js
│   │   ├── transactionController.js
│   │   └── transferController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── csrf.js
│   │   ├── errorHandler.js
│   │   ├── rateLimiter.js
│   │   └── validate.js
│   ├── models/
│   │   ├── AuditLog.js
│   │   ├── BankAccount.js
│   │   ├── LedgerEntry.js
│   │   ├── Transfer.js
│   │   └── User.js
│   ├── routes/
│   │   ├── accountRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── profileRoutes.js
│   │   ├── transactionRoutes.js
│   │   └── transferRoutes.js
│   ├── seed/
│   │   └── seedData.js
│   ├── services/
│   │   ├── accountService.js
│   │   ├── auditService.js
│   │   ├── authService.js
│   │   ├── transactionService.js
│   │   └── transferService.js
│   ├── tests/
│   │   └── banking.test.js
│   ├── validators/
│   │   ├── authValidator.js
│   │   ├── profileValidator.js
│   │   └── transferValidator.js
│   ├── app.js
│   ├── server.js
│   └── package.json
├── screenshots/
│   ├── 01-login-screen.png
│   ├── 02-customer-dashboard.png
│   ├── 03-account-details.png
│   ├── 04-transfer-money.png
│   ├── 05-transaction-history.png
│   ├── 06-account-statement.png
│   ├── 07-profile-security.png
│   └── 08-admin-oversight.png
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 🔒 Cybersecurity & Financial Integrity

SecurePay adheres to OWASP guidelines and banking security benchmarks:

1. **Integer Paise Storage**: Financial values are stored as integers (`balancePaise`, `amountPaise`) to eliminate JavaScript floating-point errors (e.g. `0.1 + 0.2 !== 0.3`).
2. **MongoDB Transaction Isolation**: Fund transfers execute within a multi-document session. If debiting the sender, crediting the recipient, or creating ledger entries fails, the entire transaction rolls back cleanly.
3. **Double Submit Cookie CSRF Defense**: Mutating endpoints (`POST`, `PUT`, `PATCH`, `DELETE`) require a matching `x-csrf-token` header generated on session authentication.
4. **Brute Force Cooldown**: 5 consecutive failed login attempts locks the user account for 15 minutes, with remaining attempts communicated safely.
5. **Rate Limiting**:
   - General API: 200 requests per 15 minutes.
   - Authentication: 10 attempts per 15 minutes per IP.
   - Transfers: 30 transfers per 10 minutes.
6. **Strict Schema Validation**: Zod schemas validate request payloads before hitting database controllers.
7. **Audit Logging**: Sensitive operations (`LOGIN_SUCCESS`, `LOGIN_FAILURE`, `TRANSFER_SUCCESS`, `ACCOUNT_STATUS_CHANGED`, `PASSWORD_CHANGED`) are logged with actor details, timestamps, and IP addresses.

---

## ⚙️ Prerequisites & Environment Setup

- **Node.js**: `v18.0.0` or higher (tested on Node `v24.11.0`)
- **npm**: `v9.0.0` or higher
- **MongoDB**: MongoDB 6.0+ Replica Set or MongoDB Atlas.  
  *(Note: If no external MongoDB URI is provided, SecurePay automatically spins up a real in-memory MongoDB Replica Set with full ACID transaction support out-of-the-box!)*

### Environment Variables (`.env.example`)

Copy `.env.example` to `server/.env`:
```bash
cp .env.example server/.env
```

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment | `development` |
| `PORT` | Backend server port | `5000` |
| `CLIENT_URL` | Allowed origin for CORS & Cookies | `http://localhost:5173` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/securepay_mock_banking` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `min_32_characters_random_string` |
| `JWT_EXPIRES_IN` | Session duration | `7d` |
| `COOKIE_SECURE` | Set `true` in production with HTTPS | `false` |
| `COOKIE_SAME_SITE` | Cookie cross-site policy | `lax` |
| `INITIAL_DEMO_BALANCE_PAISE` | Initial balance for new users | `5000000` (₹50,000.00) |
| `MIN_TRANSFER_PAISE` | Minimum transfer limit | `100` (₹1.00) |
| `MAX_TRANSFER_PAISE` | Maximum transfer limit | `20000000` (₹2,00,000.00) |

---

## 💻 Installation & Quick Start

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/sudharshanps/SecurePay---Mock-Online-Banking-Portal.git
cd SecurePay---Mock-Online-Banking-Portal

# Install root, backend, and frontend dependencies
npm run install:all
```

### 2. Seed Database with Demo Accounts

```bash
# Seeds 1 Administrator, 12 Customers, and 36 completed mock transactions
npm run seed
```

### 3. Run Development Servers Concurrently

```bash
# Starts Express backend (:5000) and Vite frontend (:5173) together
npm run dev
```

Visit the application at: **`http://localhost:5173`**

---

## 👥 Database Seeding & Demo Credentials

| Role | Name | Email Address | Password | Account Number | Initial Balance |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Admin** | TrustBank Administrator | `admin@trustbank.local` | `Admin@TrustBank2026!` | N/A | System Oversight |
| **Customer 1** | Aarav Sharma | `aarav.sharma@example.com` | `Customer@123456` | `1001002001` | ₹75,000.00 (Savings) |
| **Customer 2** | Priya Patel | `priya.patel@example.com` | `Customer@123456` | `1001002002` | ₹1,20,000.00 (Savings) |
| **Customer 3** | Rajesh Kumar | `rajesh.kumar@example.com` | `Customer@123456` | `1001002003` | ₹2,50,000.00 (Current) |
| **Customer 4** | Ananya Iyer | `ananya.iyer@example.com` | `Customer@123456` | `1001002004` | ₹45,000.00 (Savings) |
| **Customer 5** | Vikram Malhotra | `vikram.malhotra@example.com` | `Customer@123456` | `1001002005` | ₹1,80,000.00 (Current) |

*(The login screen includes quick-fill buttons to autofill these credentials with a single click.)*

---

## 📡 REST API Documentation

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Create new customer and initialize simulated bank account.
- `POST /api/auth/login` — Authenticate customer or administrator; returns HTTP-only cookie.
- `POST /api/auth/logout` — Clear authentication cookie and log audit event.
- `GET /api/auth/me` — Retrieve currently authenticated user and linked bank account.
- `GET /api/auth/csrf-token` — Retrieve double-submit CSRF cookie & token.

### Bank Accounts (`/api/accounts`)
- `GET /api/accounts/me` — Retrieve detailed specifications of user's bank account.
- `GET /api/accounts/summary` — Retrieve dashboard statistics, monthly chart metrics, and recent transactions.

### Mock Transfers (`/api/transfers`)
- `POST /api/transfers/verify-recipient` — Verify beneficiary dummy account exists and is eligible.
- `POST /api/transfers` — Execute atomic fund transfer with idempotency protection.
- `GET /api/transfers/:id/receipt` — Retrieve transfer confirmation receipt.

### Transactions & Statements (`/api/transactions`)
- `GET /api/transactions` — Query paginated transaction history with filters (search, type, date range).
- `GET /api/transactions/:id` — Retrieve itemized ledger record.
- `GET /api/transactions/statement` — Generate statement summary (opening/closing balance, totals, list).

### Profile & Security (`/api/profile`)
- `GET /api/profile` — Fetch user profile, linked account, and recent security logs.
- `PUT /api/profile` — Update name, email, or phone number.
- `PUT /api/profile/password` — Change password after verifying current credentials.

### Administrator (`/api/admin`)
- `GET /api/admin/dashboard` — System-wide liquidity metrics, account totals, and volume statistics.
- `GET /api/admin/accounts` — Search all customer accounts with pagination and status filters.
- `PATCH /api/admin/accounts/:id/status` — Suspend or reactivate customer accounts.
- `GET /api/admin/audit-logs` — Query security audit logs with action and result filters.

---

## 🧪 Automated Testing & Results

The backend includes a comprehensive integration test suite built with **Vitest** and **Supertest** running against an active MongoDB Replica Set session.

### Test Execution
```bash
npm test
```

### Verified Test Suite (18 / 18 Tests Passing):
```text
 ✓ tests/banking.test.js (18 tests) 3788ms
   ✓ 1. Authentication & Account Creation
     ✓ should register Customer A successfully and create a linked BankAccount with ₹50,000 balance
     ✓ should register Customer B successfully
     ✓ should reject registration with duplicate email
     ✓ should reject login with invalid password and track attempts
     ✓ should login Customer A with valid credentials and return JWT cookie
     ✓ should login Customer B
   ✓ 2. Protected Routes & Authorization
     ✓ should reject unauthenticated request to /api/accounts/me with 401
     ✓ should permit authenticated request to /api/accounts/me
     ✓ should reject non-admin access to admin dashboard with 403
   ✓ 3. Recipient Verification & Mock Transfers
     ✓ should successfully verify an existing recipient account
     ✓ should reject self-transfer attempt
     ✓ should reject transfer with insufficient funds
     ✓ should successfully execute ₹5,000 mock transfer from Customer A to Customer B
     ✓ should safely return existing receipt when same idempotency key is submitted (no double charge)
   ✓ 4. Transaction History & Account Statement
     ✓ should return paginated transaction history for Customer A
     ✓ should return accurate account statement for Customer A
   ✓ 5. Profile & Password Update
     ✓ should reject password change with incorrect current password
     ✓ should successfully update password with valid current password
```

---

## 📷 Screenshots

| 01. Login Screen | 02. Customer Dashboard |
| :---: | :---: |
| ![Login Screen](screenshots/01-login-screen.png) | ![Customer Dashboard](screenshots/02-customer-dashboard.png) |
| *Secure Login with Show/Hide Password & Demo Quick-Fill* | *Active Balances, Quick Actions, and 6-Month Chart* |

| 03. Bank Account Details | 04. Mock Fund Transfer |
| :---: | :---: |
| ![Account Details](screenshots/03-account-details.png) | ![Fund Transfer](screenshots/04-transfer-money.png) |
| *Visual Card Presentation, Status & Specifications* | *Beneficiary Verification & Atomic Transfer Execution* |

| 05. Transaction History | 06. Account Statement |
| :---: | :---: |
| ![Transaction History](screenshots/05-transaction-history.png) | ![Account Statement](screenshots/06-account-statement.png) |
| *Search, Filter by Type & Date Range, Pagination* | *Period Summary, PDF Statement & CSV Export* |

| 07. Profile & Security | 08. Administrator Oversight |
| :---: | :---: |
| ![Profile & Security](screenshots/07-profile-security.png) | ![Admin Oversight](screenshots/08-admin-oversight.png) |
| *Contact Information Update & Password Change* | *System Liquidity Aggregation & Account Controls* |

---

## 🌐 HTTPS & Production Deployment Guidelines

For production deployment:

1. **Enable HTTPS / SSL**:
   - Deploy behind a Reverse Proxy (such as NGINX, Caddy, or AWS ALB) terminating SSL/TLS certificates (e.g., Let's Encrypt).
   - Configure NGINX:
     ```nginx
     server {
       listen 443 ssl http2;
       server_name banking.yourdomain.com;
       ssl_certificate /etc/letsencrypt/live/banking.yourdomain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/banking.yourdomain.com/privkey.pem;

       location /api {
         proxy_pass http://localhost:5000;
         proxy_set_header Host $host;
         proxy_set_header X-Real-IP $remote_addr;
         proxy_set_header X-Forwarded-Proto https;
       }

       location / {
         root /var/www/securepay/client/dist;
         try_files $uri $uri/ /index.html;
       }
     }
     ```
2. **Set Production Environment Variables**:
   ```ini
   NODE_ENV=production
   COOKIE_SECURE=true
   COOKIE_SAME_SITE=strict
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/securepay_prod?retryWrites=true&w=majority
   ```
3. **Database Security**:
   - Restrict MongoDB network access to server IP addresses only.
   - Enforce encrypted connections (`ssl=true`).

---

## 📌 Known Limitations & Future Roadmap

### Known Simulation Limitations:
- Simulated accounts use synthetic Indian Rupee balances for demonstration; no real clearing houses (NEFT/RTGS/IMPS) are contacted.
- Email verification uses immediate local confirmation rather than an active SMTP relay.

### Future Roadmap:
- [ ] Multi-Factor Authentication (TOTP via Google Authenticator).
- [ ] Recurring scheduled automated transfers and standing instructions.
- [ ] Multi-currency virtual wallets with simulated FX rates.
- [ ] Push notifications via WebSockets for real-time credit alerts.

---

## 📄 License & Attribution

Developed for **TrustBank Digital** by Senior Full-Stack Engineering Team.  
Released under the **MIT License**.
