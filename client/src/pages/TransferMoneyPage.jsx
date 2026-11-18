import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import api from '../services/api.js';
import {
  SendHorizontal,
  UserCheck,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import TransferReceiptModal from '../components/TransferReceiptModal.jsx';

export const TransferMoneyPage = () => {
  const { user, account, updateAccountState } = useAuth();

  // Form states
  const [recipientAccountNum, setRecipientAccountNum] = useState('');
  const [recipientData, setRecipientData] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');

  // Confirmation step state
  const [isReviewing, setIsReviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [completedReceipt, setCompletedReceipt] = useState(null);

  // Generate unique idempotency key when component mounts or resets
  const generateNewIdempotencyKey = () => {
    const key = `IDEMP-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    setIdempotencyKey(key);
  };

  useEffect(() => {
    generateNewIdempotencyKey();
  }, []);

  // Step 1: Verify Recipient
  const handleVerifyRecipient = async (e) => {
    if (e) e.preventDefault();
    setVerifyError('');
    setRecipientData(null);
    setIsReviewing(false);

    if (!recipientAccountNum || recipientAccountNum.trim().length < 6) {
      setVerifyError('Please enter a valid recipient account number.');
      return;
    }

    setVerifying(true);
    try {
      const res = await api.post('/transfers/verify-recipient', {
        recipientAccountNumber: recipientAccountNum.trim(),
      });
      if (res.success && res.data) {
        setRecipientData(res.data);
      }
    } catch (err) {
      setVerifyError(err.message || 'Recipient account verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  // Step 2: Proceed to Review
  const handleProceedToReview = (e) => {
    e.preventDefault();
    setSubmitError('');

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setSubmitError('Please enter a transfer amount greater than zero.');
      return;
    }

    if (account?.balanceRupees !== undefined && numAmount > account.balanceRupees) {
      setSubmitError(`Insufficient balance. Maximum available: ${account.formattedBalance}`);
      return;
    }

    setIsReviewing(true);
  };

  // Step 3: Confirm and Execute Transfer
  const handleConfirmTransfer = async () => {
    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await api.post('/transfers', {
        recipientAccountNumber: recipientData.accountNumber,
        amount: parseFloat(amount),
        description: description.trim() || 'Mock Fund Transfer',
        idempotencyKey,
      });

      if (res.success && res.receipt) {
        setCompletedReceipt(res.receipt);
        setIsReviewing(false);

        // Update local available balance state
        if (res.receipt.sender?.balanceAfterPaise !== undefined) {
          updateAccountState({
            balancePaise: res.receipt.sender.balanceAfterPaise,
            formattedBalance: res.receipt.sender.formattedBalanceAfter,
            balanceRupees: res.receipt.sender.balanceAfterPaise / 100,
          });
        }

        // Reset form for next transfer
        setAmount('');
        setDescription('');
        setRecipientData(null);
        setRecipientAccountNum('');
        generateNewIdempotencyKey();
      }
    } catch (err) {
      setSubmitError(err.message || 'Transfer failed. Transaction rolled back.');
    } finally {
      setSubmitting(false);
    }
  };

  const quickAmounts = [500, 1000, 2500, 5000, 10000];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Mock Fund Transfer
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Atomic balance transfer using MongoDB sessions & ledger records
        </p>
      </div>

      {/* Available Balance Header Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Sender Account Balance
            </span>
            <span className="text-lg font-bold text-slate-900 font-mono">
              {account?.formattedBalance || '₹0.00'}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-slate-400 block">Sender Account</span>
          <span className="text-xs font-mono font-semibold text-slate-700">
            {account?.maskedAccountNumber || account?.accountNumber}
          </span>
        </div>
      </div>

      {/* Main Transfer Form Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="bg-navy-950 p-4 sm:px-6 sm:py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <SendHorizontal className="w-5 h-5 text-teal-400" />
            <span className="font-bold text-sm tracking-tight">Simulated Transfer System</span>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider bg-teal-500/20 text-teal-300 px-2.5 py-0.5 rounded-full border border-teal-500/30">
            Atomic Session
          </span>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {submitError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span className="leading-relaxed font-medium">{submitError}</span>
            </div>
          )}

          {!isReviewing ? (
            <form onSubmit={handleProceedToReview} className="space-y-5">
              {/* Recipient Account Input with Verify Button */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Recipient Dummy Account Number
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={recipientAccountNum}
                    onChange={(e) => {
                      setRecipientAccountNum(e.target.value);
                      if (recipientData) setRecipientData(null);
                    }}
                    placeholder="Enter 10-digit account (e.g. 1001002002)"
                    className="flex-1 px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyRecipient}
                    disabled={verifying || !recipientAccountNum}
                    className="py-2.5 px-4 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1.5 disabled:opacity-50 shrink-0"
                  >
                    {verifying ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                    )}
                    <span>Verify</span>
                  </button>
                </div>

                {verifyError && (
                  <p className="mt-1.5 text-xs text-rose-600 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{verifyError}</span>
                  </p>
                )}

                {/* Verified Recipient Banner */}
                {recipientData && (
                  <div className="mt-2.5 p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-900 block">{recipientData.recipientName}</span>
                        <span className="text-slate-500 text-[11px]">
                          Account: {recipientData.maskedAccountNumber} • {(recipientData.accountType || 'Savings').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-600 text-white uppercase">
                      Verified
                    </span>
                  </div>
                )}
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Transfer Amount (in Indian Rupees ₹)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-bold">
                    ₹
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max="200000"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="block w-full pl-8 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-base font-bold text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  />
                </div>

                {/* Quick amount chips */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {quickAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmount(String(amt))}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors border border-slate-200"
                    >
                      +₹{amt.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Transfer Purpose / Description (Optional)
                </label>
                <input
                  type="text"
                  maxLength={200}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Rent, consulting invoice, dinner split"
                  className="block w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>

              {/* Review Button */}
              <button
                type="submit"
                disabled={!recipientData || !amount}
                className="w-full mt-4 py-3 px-4 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>Review Transfer Details</span>
                <ArrowRight className="w-4 h-4 text-teal-400" />
              </button>
            </form>
          ) : (
            /* Review & Confirmation Step */
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Please Confirm Transaction Details
                </span>

                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Beneficiary Name:</span>
                  <span className="font-bold text-slate-900">{recipientData?.recipientName}</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Beneficiary Account:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {recipientData?.accountNumber}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Transfer Amount:</span>
                  <span className="font-bold text-blue-600 text-sm">
                    ₹{Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Description:</span>
                  <span className="font-medium text-slate-800">
                    {description || 'Mock Fund Transfer'}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 text-slate-500">
                  <span>Balance After Transfer:</span>
                  <span className="font-semibold text-slate-700">
                    ₹{(account?.balanceRupees - parseFloat(amount)).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsReviewing(false)}
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Back to Edit
                </button>

                <button
                  type="button"
                  onClick={handleConfirmTransfer}
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center justify-center space-x-2 disabled:opacity-60"
                >
                  {submitting ? (
                    <span>Executing Atomic Transfer...</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Confirm & Execute</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transfer Receipt Modal */}
      <TransferReceiptModal
        isOpen={!!completedReceipt}
        onClose={() => setCompletedReceipt(null)}
        receipt={completedReceipt}
      />
    </div>
  );
};

export default TransferMoneyPage;
