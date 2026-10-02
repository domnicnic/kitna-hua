import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { useLedger } from '../context/LedgerContext';
import { useAuth } from '../context/AuthContext';
import { exportPDF } from '../services/pdfService';
import { generateInstantSlipText, sendWhatsAppMessage } from '../services/whatsappService';
import { QuickCalculatorPad } from '../components/QuickCalculatorPad';
import { EditTransactionModal } from '../components/EditTransactionModal';
import { ArrowLeft, Phone, MapPin, Wallet, FileText, PlusCircle, ArrowUpRight, ArrowDownLeft, CheckCircle2, Edit2, Trash2, CheckCheck } from 'lucide-react-native';
import { Transaction, TransactionType } from '../types';
import { db } from '../database/db';

interface CustomerDetailScreenProps {
  customerId: string;
  onBack: () => void;
}

export const CustomerDetailScreen: React.FC<CustomerDetailScreenProps> = ({
  customerId,
  onBack
}) => {
  const { getCustomerDetails, addNewTransaction, refreshData, selectedMonth } = useLedger();
  const { storeProfile } = useAuth();

  const { customer, transactions, totalUdhaar, totalJama, advanceBalance, currentBalance } = getCustomerDetails(customerId);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'UDHAAR' | 'JAMA' | 'ADVANCE'>('ALL');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  if (!customer) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Customer Account Not Found</Text>
        <TouchableOpacity onPress={onBack} style={styles.backBtnBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const filteredTxs = transactions.filter(t => {
    if (activeTab === 'UDHAAR') return t.type === 'UDHAAR';
    if (activeTab === 'JAMA') return t.type === 'JAMA' || t.type === 'FULL_SETTLEMENT';
    if (activeTab === 'ADVANCE') return t.type === 'ADVANCE_DEPOSIT';
    return true;
  });

  const handleExportPDF = async () => {
    await exportPDF({
      storeProfile: storeProfile || undefined,
      customer,
      transactions: filteredTxs,
      billingMonth: selectedMonth,
      openingBalance: 0,
      closingBalance: currentBalance
    });
  };

  // Full Settlement / "Deposit All Money" action
  const handleDepositAllMoney = async () => {
    if (currentBalance <= 0) {
      Alert.alert('No Dues Outstanding', 'Customer account balance is already clear or in advance.');
      return;
    }

    Alert.alert(
      'Settle Full Account Balance?',
      `Deposit total ₹${currentBalance} cash/UPI to clear all outstanding dues for ${customer.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deposit Full Amount (Clear All)',
          onPress: async () => {
            const closingAmt = currentBalance;
            const newTx = await addNewTransaction(
              customerId,
              'FULL_SETTLEMENT',
              closingAmt,
              [],
              'Full Account Settlement - All Dues Cleared'
            );

            Alert.alert(
              'Account Fully Paid! 🎉',
              `Full settlement of ₹${closingAmt} recorded. Send instant WhatsApp confirmation?`,
              [
                { text: 'Skip', style: 'cancel' },
                {
                  text: 'Send Receipt (WhatsApp)',
                  onPress: () => {
                    const slipText = generateInstantSlipText({
                      customer,
                      storeName: storeProfile?.store_name || 'Store',
                      transaction: newTx,
                      closingBalance: 0
                    });
                    sendWhatsAppMessage(customer.phone, slipText);
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const handleSaveTransaction = async (
    type: TransactionType,
    amount: number,
    items?: any[],
    notes?: string
  ) => {
    const newTx = await addNewTransaction(customerId, type, amount, items, notes);
    setIsBillingModalOpen(false);

    const newBalance = type === 'UDHAAR' 
      ? currentBalance + amount 
      : currentBalance - amount;

    Alert.alert(
      'Transaction Saved!',
      `Entry of ₹${amount} recorded. Send instant WhatsApp slip to ${customer.name}?`,
      [
        { text: 'Skip', style: 'cancel' },
        {
          text: 'Send Slip (WhatsApp)',
          onPress: () => {
            const slipText = generateInstantSlipText({
              customer,
              storeName: storeProfile?.store_name || 'Store',
              transaction: newTx,
              closingBalance: newBalance
            });
            sendWhatsAppMessage(customer.phone, slipText);
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Detail Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backIcon}>
          <ArrowLeft size={22} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerTitleCol}>
          <Text style={styles.customerName} numberOfLines={1}>{customer.name}</Text>
          <Text style={styles.customerSub}>{customer.phone} {customer.address ? `• ${customer.address}` : ''}</Text>
        </View>
        <TouchableOpacity onPress={handleExportPDF} style={styles.pdfBtn}>
          <FileText size={18} color="#38bdf8" />
          <Text style={styles.pdfBtnText}>PDF</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody}>
        {/* Balance Overview Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceMainRow}>
            <View>
              <Text style={styles.netLabel}>NET ACCOUNT BALANCE</Text>
              <Text style={[styles.netValue, currentBalance > 0 ? styles.textRed : styles.textGreen]}>
                ₹{Math.abs(currentBalance).toLocaleString('en-IN')}
                <Text style={styles.netSuffix}>
                  {currentBalance > 0 ? ' (Due / Bakaya)' : currentBalance < 0 ? ' (Advance)' : ' (Clear)'}
                </Text>
              </Text>
            </View>

            <TouchableOpacity
              style={styles.addEntryBtn}
              onPress={() => setIsBillingModalOpen(true)}
            >
              <PlusCircle size={18} color="#ffffff" />
              <Text style={styles.addEntryText}>New Entry</Text>
            </TouchableOpacity>
          </View>

          {/* Settle Full Balance / Deposit All Money Button */}
          {currentBalance > 0 ? (
            <TouchableOpacity
              style={styles.settleBtn}
              onPress={handleDepositAllMoney}
              activeOpacity={0.85}
            >
              <CheckCircle2 size={18} color="#ffffff" />
              <Text style={styles.settleBtnText}>
                DEPOSIT ALL MONEY (SETTLE FULL DUES ₹{currentBalance})
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.fullyPaidBadge}>
              <CheckCheck size={16} color="#16a34a" />
              <Text style={styles.fullyPaidText}>ACCOUNT FULLY PAID & SETTLED</Text>
            </View>
          )}

          <View style={styles.divider} />

          {/* 3 Ledger Tracks */}
          <View style={styles.tracksRow}>
            <View style={styles.trackBox}>
              <Text style={styles.trackLabel}>Total Udhaar</Text>
              <Text style={[styles.trackVal, styles.textRed]}>₹{totalUdhaar}</Text>
            </View>
            <View style={styles.trackBox}>
              <Text style={styles.trackLabel}>Total Jama</Text>
              <Text style={[styles.trackVal, styles.textGreen]}>₹{totalJama}</Text>
            </View>
            <View style={styles.trackBox}>
              <Text style={styles.trackLabel}>Advance Wallet</Text>
              <Text style={[styles.trackVal, styles.textBlue]}>₹{advanceBalance}</Text>
            </View>
          </View>
        </View>

        {/* Tab Filters */}
        <View style={styles.tabsRow}>
          {(['ALL', 'UDHAAR', 'JAMA', 'ADVANCE'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transactions Slip History */}
        <View style={styles.txSection}>
          <Text style={styles.txSectionTitle}>Ledger Entries ({filteredTxs.length})</Text>

          {filteredTxs.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No entries recorded for this filter.</Text>
            </View>
          ) : (
            filteredTxs.map(tx => {
              const isUdhaar = tx.type === 'UDHAAR';
              const isJama = tx.type === 'JAMA' || tx.type === 'FULL_SETTLEMENT';

              return (
                <View key={tx.id} style={styles.txCard}>
                  <View style={styles.txLeft}>
                    <View style={[styles.txBadgeIcon, isUdhaar ? styles.badgeRed : isJama ? styles.badgeGreen : styles.badgeBlue]}>
                      {isUdhaar ? <ArrowUpRight size={16} color="#dc2626" /> : isJama ? <ArrowDownLeft size={16} color="#16a34a" /> : <Wallet size={16} color="#0284c7" />}
                    </View>
                    <View style={styles.txInfo}>
                      <Text style={styles.txTypeTitle}>
                        {tx.type === 'FULL_SETTLEMENT' ? 'Full Settlement (Paid)' : isUdhaar ? 'Udhaar (GAVE)' : isJama ? 'Jama (GOT)' : 'Advance Deposit'}
                      </Text>
                      <Text style={styles.txDate}>
                        {new Date(tx.created_at).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </Text>
                      {tx.items && tx.items.length > 0 && (
                        <Text style={styles.itemsSummary}>
                          Items: {tx.items.map(i => `${i.item_name} (x${i.quantity})`).join(', ')}
                        </Text>
                      )}
                      {tx.notes ? <Text style={styles.txNotes}>"{tx.notes}"</Text> : null}
                    </View>
                  </View>

                  <View style={styles.txRightCol}>
                    <Text style={[styles.txAmount, isUdhaar ? styles.textRed : styles.textGreen]}>
                      {isUdhaar ? `+₹${tx.total_amount}` : `-₹${tx.total_amount}`}
                    </Text>

                    <TouchableOpacity
                      style={styles.editTxBtn}
                      onPress={() => setEditingTx(tx)}
                    >
                      <Edit2 size={12} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Calculator Modal */}
      <Modal visible={isBillingModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Entry for {customer.name}</Text>
              <TouchableOpacity onPress={() => setIsBillingModalOpen(false)}>
                <Text style={styles.closeX}>✕</Text>
              </TouchableOpacity>
            </View>
            <QuickCalculatorPad
              customerName={customer.name}
              onSaveTransaction={handleSaveTransaction}
            />
          </View>
        </View>
      </Modal>

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        visible={!!editingTx}
        transaction={editingTx}
        onClose={() => setEditingTx(null)}
        onUpdate={async (txId, amount, notes) => {
          await db.updateTransaction(txId, { total_amount: amount, notes });
          await refreshData();
        }}
        onDelete={async (txId) => {
          await db.deleteTransaction(txId);
          await refreshData();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: 16,
    color: '#64748b',
  },
  backBtnBtn: {
    marginTop: 12,
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  header: {
    backgroundColor: '#0f172a',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backIcon: {
    padding: 6,
  },
  headerTitleCol: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  customerSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  pdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#38bdf8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  pdfBtnText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 40,
  },
  balanceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 16,
  },
  balanceMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  netLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  netValue: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 4,
  },
  netSuffix: {
    fontSize: 12,
    fontWeight: '600',
  },
  addEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  addEntryText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  settleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginTop: 14,
    gap: 6,
  },
  settleBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  fullyPaidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 14,
    gap: 6,
  },
  fullyPaidText: {
    color: '#16a34a',
    fontSize: 11,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 14,
  },
  tracksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trackBox: {
    flex: 1,
    alignItems: 'center',
  },
  trackLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  trackVal: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  textRed: { color: '#dc2626' },
  textGreen: { color: '#16a34a' },
  textBlue: { color: '#0284c7' },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#ffffff',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#0f172a',
    fontWeight: '700',
  },
  txSection: {
    marginTop: 4,
  },
  txSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
  },
  emptyBox: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  txCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  txBadgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  badgeRed: { backgroundColor: '#fee2e2' },
  badgeGreen: { backgroundColor: '#dcfce7' },
  badgeBlue: { backgroundColor: '#e0f2fe' },
  txInfo: { flex: 1 },
  txTypeTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  txDate: { fontSize: 11, color: '#64748b', marginTop: 2 },
  itemsSummary: { fontSize: 12, color: '#2563eb', fontWeight: '600', marginTop: 2 },
  txNotes: { fontSize: 12, color: '#475569', fontStyle: 'italic', marginTop: 2 },
  txRightCol: { alignItems: 'flex-end', gap: 4 },
  txAmount: { fontSize: 16, fontWeight: '800' },
  editTxBtn: { backgroundColor: '#f1f5f9', padding: 4, borderRadius: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'center', paddingHorizontal: 16 },
  modalCard: { backgroundColor: '#ffffff', borderRadius: 18, padding: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  closeX: { fontSize: 20, color: '#64748b', fontWeight: '700' },
});
