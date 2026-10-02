import { Customer, StoreProfile, Transaction } from '../types';
import { Platform } from 'react-native';

export interface GeneratePDFParams {
  storeProfile?: StoreProfile | null;
  customer?: Customer;
  transactions: Transaction[];
  billingMonth: string;
  openingBalance?: number;
  closingBalance?: number;
}

export const generateLedgerHTML = ({
  storeProfile,
  customer,
  transactions,
  billingMonth,
  openingBalance = 0,
  closingBalance = 0,
}: GeneratePDFParams): string => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const [yearStr, monthStr] = billingMonth.split('-');
  const monthTitle = `${monthNames[parseInt(monthStr, 10) - 1] || ''} ${yearStr}`;

  let rowsHTML = '';
  let runningBalance = openingBalance;

  transactions.forEach((tx, idx) => {
    const isUdhaar = tx.type === 'UDHAAR';
    const isJama = tx.type === 'JAMA';
    const isAdvance = tx.type === 'ADVANCE_DEPOSIT';

    if (isUdhaar) runningBalance += tx.total_amount;
    if (isJama) runningBalance -= tx.total_amount;
    if (isAdvance) runningBalance -= tx.total_amount;

    let itemsDesc = tx.notes || '';
    if (tx.items && tx.items.length > 0) {
      itemsDesc = tx.items.map(i => `${i.item_name} (${i.quantity} x ₹${i.rate})`).join(', ');
    }

    const typeBadge = isUdhaar 
      ? '<span style="background: #fee2e2; color: #dc2626; padding: 2px 8px; border-radius: 4px; font-weight: 600;">UDHAAR</span>'
      : isJama
      ? '<span style="background: #dcfce7; color: #16a34a; padding: 2px 8px; border-radius: 4px; font-weight: 600;">JAMA</span>'
      : '<span style="background: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 4px; font-weight: 600;">ADVANCE</span>';

    const dateStr = new Date(tx.created_at).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });

    rowsHTML += `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px; font-size: 13px; color: #4b5563;">${dateStr}</td>
        <td style="padding: 10px; font-size: 13px;">${typeBadge}</td>
        <td style="padding: 10px; font-size: 13px; color: #1f2937;">${itemsDesc || '-'}</td>
        <td style="padding: 10px; font-size: 13px; text-align: right; color: ${isUdhaar ? '#dc2626' : '#16a34a'}; font-weight: 600;">
          ${isUdhaar ? `+₹${tx.total_amount}` : `-₹${tx.total_amount}`}
        </td>
        <td style="padding: 10px; font-size: 13px; text-align: right; font-weight: 700; color: ${runningBalance >= 0 ? '#b91c1c' : '#15803d'};">
          ₹${Math.abs(runningBalance)} ${runningBalance > 0 ? 'Dr (Due)' : runningBalance < 0 ? 'Cr (Adv)' : ''}
        </td>
      </tr>
    `;
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Ledger Statement - ${storeProfile?.store_name || 'Store'}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 24px; color: #1f2937; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; }
          .title { font-size: 24px; font-weight: bold; color: #1e40af; margin: 0; }
          .subtitle { font-size: 14px; color: #6b7280; margin-top: 4px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
          .grid { display: flex; justify-content: space-between; gap: 16px; }
          .stat-box { flex: 1; text-align: center; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; }
          .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600; }
          .stat-val { font-size: 18px; font-weight: bold; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th { background: #1e40af; color: white; text-align: left; padding: 10px; font-size: 13px; }
          th.right { text-align: right; }
          .footer { margin-top: 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">${storeProfile?.store_name || 'Kitna Hua Digital Ledger'}</h1>
            <div class="subtitle">Prop: ${storeProfile?.owner_name || 'Store Owner'} | Tel: ${storeProfile?.phone || ''}</div>
            <div class="subtitle">${storeProfile?.address || ''}</div>
          </div>
          <div style="text-align: right;">
            <h2 style="margin: 0; font-size: 18px; color: #3b82f6;">HISAAB STATEMENT</h2>
            <div class="subtitle">Month: <strong>${monthTitle}</strong></div>
            <div class="subtitle">Date: ${new Date().toLocaleDateString('en-IN')}</div>
          </div>
        </div>

        ${customer ? `
        <div class="card">
          <div style="font-size: 16px; font-weight: bold; color: #0f172a;">Customer Details</div>
          <div style="font-size: 14px; margin-top: 4px;"><strong>Name:</strong> ${customer.name} | <strong>Phone:</strong> ${customer.phone}</div>
          ${customer.address ? `<div style="font-size: 13px; color: #64748b;"><strong>Address:</strong> ${customer.address}</div>` : ''}
        </div>
        ` : ''}

        <div class="grid">
          <div class="stat-box">
            <div class="stat-label">Opening Balance</div>
            <div class="stat-val" style="color: #475569;">₹${openingBalance}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Closing Balance (Net)</div>
            <div class="stat-val" style="color: ${closingBalance > 0 ? '#dc2626' : '#16a34a'};">
              ₹${Math.abs(closingBalance)} ${closingBalance > 0 ? '(Due)' : closingBalance < 0 ? '(Advance)' : '(Clear)'}
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Items / Notes</th>
              <th class="right">Amount (₹)</th>
              <th class="right">Balance (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHTML || '<tr><td colspan="5" style="text-align:center; padding: 20px; color: #94a3b8;">No transactions recorded for this month.</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          Generated automatically via <strong>Kitna Hua</strong> Digital Khata & Billing Application
        </div>
      </body>
    </html>
  `;
};

export const exportPDF = async (params: GeneratePDFParams): Promise<void> => {
  const html = generateLedgerHTML(params);

  try {
    if (Platform.OS !== 'web') {
      const Print = require('expo-print');
      const Sharing = require('expo-sharing');
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } else {
      // Web fallback printing window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
      }
    }
  } catch (err) {
    console.error('Failed to export PDF:', err);
  }
};
