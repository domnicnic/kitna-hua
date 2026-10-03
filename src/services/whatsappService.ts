import { Linking, Platform } from 'react-native';
import { Customer, Transaction } from '../types';

export interface InstantSlipParams {
  customer: Customer;
  storeName: string;
  transaction: Transaction;
  closingBalance: number;
}

export interface MonthlySlipParams {
  customer: Customer;
  storeName: string;
  monthName: string;
  openingBalance: number;
  monthlyPurchases: number;
  monthlyPayments: number;
  closingBalance: number;
}

export const generateInstantSlipText = ({
  customer,
  storeName,
  transaction,
  closingBalance,
}: InstantSlipParams): string => {
  let itemSummary = '';
  if (transaction.items && transaction.items.length > 0) {
    itemSummary = transaction.items.map(i => `• ${i.item_name} x${i.quantity} = ₹${i.amount}`).join('\n');
  } else {
    itemSummary = transaction.notes || (transaction.type === 'UDHAAR' ? 'Naya Udhaar' : transaction.type === 'JAMA' ? 'Jama Payment' : 'Advance Wallet Deposit');
  }

  const txTypeLabel = transaction.type === 'UDHAAR' ? 'Kharidari (Udhaar)' : transaction.type === 'JAMA' ? 'Jama (Payment)' : 'Advance Wallet Deposit';

  return `Namaste ${customer.name} ji,

Aapka ${storeName} par naya transaction jud gaya hai:

 Type: ${txTypeLabel}
 Details:
${itemSummary}
 Amount: ₹${transaction.total_amount.toLocaleString('en-IN')}
 Kul Bakaya (Total Due): ₹${closingBalance.toLocaleString('en-IN')}

Dhanyawad!`;
};

export const generateMonthlySlipText = ({
  customer,
  storeName,
  monthName,
  openingBalance,
  monthlyPurchases,
  monthlyPayments,
  closingBalance,
}: MonthlySlipParams): string => {
  return `Namaste ${customer.name} ji,

${storeName} se aapka ${monthName} mahine ka hisaab statement:

 Pichla Balance (Opening): ₹${openingBalance.toLocaleString('en-IN')}
 Kul Kharidari (Purchases): ₹${monthlyPurchases.toLocaleString('en-IN')}
 Kul Jama (Payments): ₹${monthlyPayments.toLocaleString('en-IN')}
 Net Baki (Closing Balance): ₹${closingBalance.toLocaleString('en-IN')}

Kripya apna account verify karein.
Dhanyawad!`;
};

export const sendWhatsAppMessage = async (phone: string, text: string): Promise<boolean> => {
  // Format phone number to international format (defaulting to +91 India if 10 digits)
  let formattedPhone = phone.replace(/[^0-9]/g, '');
  if (formattedPhone.length === 10) {
    formattedPhone = `91${formattedPhone}`;
  }

  const encodedText = encodeURIComponent(text);
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedText}`;

  try {
    const canOpen = await Linking.canOpenURL(whatsappUrl);
    if (canOpen || Platform.OS === 'web') {
      await Linking.openURL(whatsappUrl);
      return true;
    } else {
      // Fallback to SMS
      const smsUrl = `sms:${formattedPhone}?body=${encodedText}`;
      await Linking.openURL(smsUrl);
      return true;
    }
  } catch (err) {
    console.error('Error opening WhatsApp/SMS link:', err);
    // Fallback direct open for web
    if (typeof window !== 'undefined' && window.open) {
      window.open(whatsappUrl, '_blank');
    }
    return false;
  }
};
