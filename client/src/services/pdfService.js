import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate and download a professional PDF receipt for a fund transfer
 */
export const downloadTransferReceiptPDF = (receipt) => {
  const doc = new jsPDF();

  // Header Banner
  doc.setFillColor(15, 32, 56); // Navy blue #0F2038
  doc.rect(0, 0, 210, 36, 'F');

  // Title & Bank Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('TrustBank Digital', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('SecurePay Fund Transfer Receipt — Simulation Demo', 14, 26);

  doc.setFontSize(10);
  doc.text(`Date: ${new Date(receipt.timestamp).toLocaleString('en-IN')}`, 140, 26);

  // Disclaimer watermark badge
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(239, 68, 68);
  doc.rect(14, 42, 182, 10, 'FD');
  doc.setTextColor(185, 28, 28);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DEMO BANKING RECEIPT — NO REAL MONEY TRANSFERRED (SIMULATION ONLY)', 24, 48);

  // Transfer Status Box
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Transaction Details', 14, 62);

  const transferDetails = [
    ['Reference ID', receipt.referenceId || 'N/A'],
    ['Status', receipt.status || 'COMPLETED'],
    ['Transfer Amount', `${receipt.formattedAmount || `INR ${receipt.amountRupees}`}`],
    ['Transfer Purpose', receipt.description || 'Mock Fund Transfer'],
    ['Execution Date & Time', new Date(receipt.timestamp).toLocaleString('en-IN')],
  ];

  autoTable(doc, {
    startY: 66,
    theme: 'plain',
    styles: { fontSize: 9.5, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', width: 60, textColor: [71, 85, 105] },
      1: { textColor: [15, 23, 42] },
    },
    body: transferDetails,
  });

  const finalY = doc.lastAutoTable.finalY + 10;

  // Sender and Recipient Accounts
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Account Information', 14, finalY);

  const partyDetails = [
    ['Sender Name', receipt.sender?.name || 'Account Holder'],
    ['Sender Account', receipt.sender?.accountNumber || receipt.sender?.maskedAccountNumber || 'N/A'],
    ['Recipient Name', receipt.recipient?.name || 'Beneficiary'],
    ['Recipient Account', receipt.recipient?.accountNumber || receipt.recipient?.maskedAccountNumber || 'N/A'],
  ];

  autoTable(doc, {
    startY: finalY + 4,
    theme: 'striped',
    headStyles: { fillColor: [15, 32, 56], textColor: 255 },
    styles: { fontSize: 9.5, cellPadding: 3.5 },
    columnStyles: {
      0: { fontStyle: 'bold', width: 60, textColor: [71, 85, 105] },
      1: { textColor: [15, 23, 42] },
    },
    body: partyDetails,
  });

  // Footer
  const footerY = 275;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, footerY, 196, footerY);

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('This is an electronically generated receipt from SecurePay Mock Online Banking Portal (TrustBank Digital).', 14, footerY + 6);
  doc.text('Valid for demonstration and academic assessment purposes only.', 14, footerY + 11);

  doc.save(`SecurePay_Receipt_${receipt.referenceId || 'TXN'}.pdf`);
};

/**
 * Generate and download an Account Statement PDF
 */
export const downloadStatementPDF = (statement) => {
  const doc = new jsPDF();

  // Header Banner
  doc.setFillColor(15, 32, 56);
  doc.rect(0, 0, 210, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('TrustBank Digital', 14, 18);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Official Account Statement (Simulated)', 14, 26);

  const startStr = new Date(statement.period.startDate).toLocaleDateString('en-IN');
  const endStr = new Date(statement.period.endDate).toLocaleDateString('en-IN');
  doc.setFontSize(9);
  doc.text(`Period: ${startStr} to ${endStr}`, 14, 34);

  // Disclaimer
  doc.setFillColor(254, 242, 242);
  doc.rect(14, 44, 182, 8, 'F');
  doc.setTextColor(185, 28, 28);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('DEMO BANKING SYSTEM — ALL BALANCES & TRANSACTIONS ARE FICTIONAL', 22, 49.5);

  // Account Holder Box
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Account Holder Summary', 14, 60);

  const accountInfo = [
    ['Account Holder:', statement.accountHolder.name, 'Account Number:', statement.accountHolder.maskedAccountNumber || statement.accountHolder.accountNumber],
    ['Email:', statement.accountHolder.email, 'Account Type:', (statement.accountHolder.accountType || 'Savings').toUpperCase()],
    ['Phone:', statement.accountHolder.phone, 'Currency:', 'Indian Rupee (INR)'],
  ];

  autoTable(doc, {
    startY: 63,
    theme: 'plain',
    styles: { fontSize: 8.5, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', width: 35, textColor: [71, 85, 105] },
      1: { width: 60, textColor: [15, 23, 42] },
      2: { fontStyle: 'bold', width: 35, textColor: [71, 85, 105] },
      3: { width: 52, textColor: [15, 23, 42] },
    },
    body: accountInfo,
  });

  // Statement Figures Summary Box
  const summaryY = doc.lastAutoTable.finalY + 4;
  const summaryData = [
    ['Opening Balance', statement.summary.formattedOpeningBalance],
    ['Total Credits (+)', statement.summary.formattedTotalCredits],
    ['Total Debits (-)', statement.summary.formattedTotalDebits],
    ['Closing Balance', statement.summary.formattedClosingBalance],
  ];

  autoTable(doc, {
    startY: summaryY,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3, halign: 'center' },
    head: [['Opening Balance', 'Total Deposits / Credits', 'Total Debits / Transfers', 'Closing Balance']],
    headStyles: { fillColor: [30, 64, 175], textColor: 255 },
    body: [[
      statement.summary.formattedOpeningBalance,
      statement.summary.formattedTotalCredits,
      statement.summary.formattedTotalDebits,
      statement.summary.formattedClosingBalance,
    ]],
  });

  // Transactions Table
  const tableY = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Transaction Ledger (${statement.transactions.length} record${statement.transactions.length === 1 ? '' : 's'})`, 14, tableY);

  const rows = statement.transactions.map((tx) => [
    new Date(tx.date).toLocaleDateString('en-IN'),
    tx.referenceId,
    tx.description || 'Fund Transfer',
    tx.counterpartyName || 'TrustBank Counterparty',
    tx.entryType,
    tx.entryType === 'CREDIT' ? `+${tx.formattedAmount}` : `-${tx.formattedAmount}`,
    tx.formattedBalanceAfter,
  ]);

  autoTable(doc, {
    startY: tableY + 4,
    theme: 'striped',
    head: [['Date', 'Ref ID', 'Description', 'Counterparty', 'Type', 'Amount', 'Balance']],
    headStyles: { fillColor: [15, 32, 56], textColor: 255, fontSize: 8.5 },
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { width: 22 },
      1: { width: 38 },
      2: { width: 40 },
      3: { width: 32 },
      4: { width: 16 },
      5: { width: 22, halign: 'right' },
      6: { width: 22, halign: 'right' },
    },
    body: rows.length > 0 ? rows : [['-', '-', 'No transactions during this period', '-', '-', '-', '-']],
  });

  doc.save(`SecurePay_Statement_${statement.accountHolder.accountNumber}_${startStr}_${endStr}.pdf`);
};

/**
 * Export statement to CSV format
 */
export const exportStatementCSV = (statement) => {
  const headers = ['Date', 'Reference ID', 'Description', 'Counterparty Name', 'Counterparty Account', 'Type', 'Amount (INR)', 'Balance After (INR)'];
  
  const rows = statement.transactions.map((tx) => [
    `"${new Date(tx.date).toISOString().slice(0, 10)}"`,
    `"${tx.referenceId}"`,
    `"${(tx.description || '').replace(/"/g, '""')}"`,
    `"${(tx.counterpartyName || '').replace(/"/g, '""')}"`,
    `"${tx.counterpartyAccountNumber || ''}"`,
    `"${tx.entryType}"`,
    `"${tx.entryType === 'CREDIT' ? tx.amountRupees : -tx.amountRupees}"`,
    `"${tx.balanceAfterRupees}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `SecurePay_Statement_${statement.accountHolder.accountNumber}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
