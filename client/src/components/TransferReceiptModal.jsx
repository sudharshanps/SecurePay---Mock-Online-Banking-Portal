import React, { useState } from 'react';
import { CheckCircle2, Download, Copy, Check, X, ShieldCheck } from 'lucide-react';
import { downloadTransferReceiptPDF } from '../services/pdfService.js';

export const TransferReceiptModal = ({ isOpen, onClose, receipt }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !receipt) return null;

  const copyRefId = () => {
    if (receipt.referenceId) {
      navigator.clipboard.writeText(receipt.referenceId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    downloadTransferReceiptPDF(receipt);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header with success checkmark */}
        <div className="bg-navy-950 px-6 pt-6 pb-5 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
            aria-label="Close receipt"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 bg-teal-500/20 text-teal-400 rounded-full flex items-center justify-center mx-auto mb-3 border border-teal-500/40">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <span className="text-[11px] font-bold tracking-widest text-teal-400 uppercase">
            Transfer Confirmed
          </span>
          <h2 className="text-2xl font-bold mt-1 text-white">
            {receipt.formattedAmount || `₹${receipt.amountRupees}`}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Simulated Mock Fund Transfer Successful
          </p>
        </div>

        {/* Demo banner inside receipt */}
        <div className="bg-amber-50 px-4 py-2 border-b border-amber-200 text-[11px] text-amber-800 text-center font-medium">
          DEMO BANKING SIMULATION — NO REAL MONEY TRANSFERRED
        </div>

        {/* Receipt Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Reference ID */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Transaction Reference ID
              </span>
              <span className="font-mono font-bold text-slate-800 text-xs">
                {receipt.referenceId}
              </span>
            </div>
            <button
              onClick={copyRefId}
              type="button"
              className="p-1.5 rounded-lg text-slate-500 hover:bg-white hover:text-slate-800 border border-transparent hover:border-slate-200"
              title="Copy reference ID"
            >
              {copied ? <Check className="w-4 h-4 text-teal-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Transfer Parties */}
          <div className="space-y-3">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Sender Account:</span>
              <span className="font-semibold text-slate-800 text-right">
                {receipt.sender?.name} <br />
                <span className="font-mono text-slate-500 text-[11px]">
                  {receipt.sender?.maskedAccountNumber || receipt.sender?.accountNumber}
                </span>
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Recipient Beneficiary:</span>
              <span className="font-semibold text-slate-800 text-right">
                {receipt.recipient?.name} <br />
                <span className="font-mono text-slate-500 text-[11px]">
                  {receipt.recipient?.maskedAccountNumber || receipt.recipient?.accountNumber}
                </span>
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Purpose / Description:</span>
              <span className="font-medium text-slate-700">
                {receipt.description || 'Mock Fund Transfer'}
              </span>
            </div>

            {receipt.sender?.formattedBalanceAfter && (
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Remaining Balance:</span>
                <span className="font-bold text-slate-900">
                  {receipt.sender.formattedBalanceAfter}
                </span>
              </div>
            )}

            <div className="flex justify-between py-1.5 text-slate-400">
              <span>Timestamp:</span>
              <span>{new Date(receipt.timestamp).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="flex-1 inline-flex items-center justify-center space-x-2 py-2.5 px-4 bg-navy-900 hover:bg-navy-800 text-white rounded-xl font-semibold shadow-xs"
            >
              <Download className="w-4 h-4 text-teal-400" />
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferReceiptModal;
