import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { MonthlyDispatchCustomer } from '../types';
import { generateMonthlySlipText, sendWhatsAppMessage } from '../services/whatsappService';
import { useAuth } from '../context/AuthContext';
import { Send, FileText, CheckCheck, X } from 'lucide-react-native';

interface DispatchesModalProps {
  visible: boolean;
  onClose: () => void;
  dispatches: MonthlyDispatchCustomer[];
  monthName: string;
}

export const DispatchesModal: React.FC<DispatchesModalProps> = ({
  visible,
  onClose,
  dispatches,
  monthName
}) => {
  const { storeProfile } = useAuth();

  const handleDispatch = (item: MonthlyDispatchCustomer) => {
    const slipText = generateMonthlySlipText({
      customer: item.customer,
      storeName: storeProfile?.store_name || 'Store',
      monthName,
      openingBalance: item.openingBalance,
      monthlyPurchases: item.monthlyUdhaar,
      monthlyPayments: item.monthlyJama,
      closingBalance: item.closingBalance
    });

    sendWhatsAppMessage(item.customer.phone, slipText);
  };

  const pendingDispatches = dispatches.filter(d => d.closingBalance !== 0);

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Pending Monthly Dispatches</Text>
              <Text style={styles.subtitle}>Statement Dispatches for {monthName}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.list}>
            {pendingDispatches.length === 0 ? (
              <View style={styles.emptyBox}>
                <CheckCheck size={36} color="#16a34a" />
                <Text style={styles.emptyTitle}>All Statements Dispatched!</Text>
                <Text style={styles.emptySub}>No pending balances requiring dispatch for {monthName}.</Text>
              </View>
            ) : (
              pendingDispatches.map((item, idx) => (
                <View key={idx} style={styles.dispatchRow}>
                  <View style={styles.custInfo}>
                    <Text style={styles.custName}>{item.customer.name}</Text>
                    <Text style={styles.custPhone}>{item.customer.phone}</Text>
                    <Text style={styles.breakdownText}>
                      Opening: ₹{item.openingBalance} | Purchases: ₹{item.monthlyUdhaar} | Jama: ₹{item.monthlyJama}
                    </Text>
                  </View>

                  <View style={styles.actionCol}>
                    <Text style={[styles.dueText, item.closingBalance > 0 ? styles.dueRed : styles.dueGreen]}>
                      ₹{Math.abs(item.closingBalance)} {item.closingBalance > 0 ? 'Due' : 'Adv'}
                    </Text>

                    <TouchableOpacity
                      style={styles.sendBtn}
                      onPress={() => handleDispatch(item)}
                    >
                      <Send size={14} color="#ffffff" />
                      <Text style={styles.sendBtnText}>WhatsApp Slip</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  list: {
    maxHeight: 400,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 36,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
  },
  dispatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  custInfo: {
    flex: 1,
    marginRight: 10,
  },
  custName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  custPhone: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  breakdownText: {
    fontSize: 11,
    color: '#475569',
    marginTop: 4,
  },
  actionCol: {
    alignItems: 'flex-end',
  },
  dueText: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  dueRed: {
    color: '#dc2626',
  },
  dueGreen: {
    color: '#16a34a',
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  sendBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});
