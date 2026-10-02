import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLedger } from '../context/LedgerContext';
import { useAuth } from '../context/AuthContext';
import { QuickCalculatorPad } from '../components/QuickCalculatorPad';
import { generateInstantSlipText, sendWhatsAppMessage } from '../services/whatsappService';
import { TransactionType, Customer } from '../types';
import { UserCheck, Check } from 'lucide-react-native';

export const DailyBillingScreen: React.FC = () => {
  const { customers, addNewTransaction } = useLedger();
  const { storeProfile } = useAuth();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    customers.length > 0 ? customers[0].id : null
  );

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const handleSaveTransaction = async (
    type: TransactionType,
    amount: number,
    items?: any[],
    notes?: string
  ) => {
    if (!selectedCustomerId || !selectedCustomer) {
      Alert.alert('Select Customer', 'Please select a customer before recording billing.');
      return;
    }

    const newTx = await addNewTransaction(selectedCustomerId, type, amount, items, notes);

    const currentBal = selectedCustomer.current_balance || 0;
    const newBalance = type === 'UDHAAR' ? currentBal + amount : currentBal - amount;

    Alert.alert(
      'Entry Recorded!',
      `₹${amount} entry saved for ${selectedCustomer.name}. Send instant slip on WhatsApp?`,
      [
        { text: 'Done', style: 'cancel' },
        {
          text: 'Send Slip (WhatsApp)',
          onPress: () => {
            const slipText = generateInstantSlipText({
              customer: selectedCustomer,
              storeName: storeProfile?.store_name || 'Store',
              transaction: newTx,
              closingBalance: newBalance
            });
            sendWhatsAppMessage(selectedCustomer.phone, slipText);
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Daily Billing & Calculator Pad</Text>
      <Text style={styles.subtitle}>Select customer and quickly enter bill items or total amount.</Text>

      {/* Customer Selector */}
      <Text style={styles.sectionLabel}>Select Customer Account</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.custScroll}>
        {customers.map(c => (
          <TouchableOpacity
            key={c.id}
            style={[styles.custChip, selectedCustomerId === c.id && styles.custChipActive]}
            onPress={() => setSelectedCustomerId(c.id)}
          >
            <UserCheck size={14} color={selectedCustomerId === c.id ? '#ffffff' : '#475569'} />
            <Text style={[styles.custChipText, selectedCustomerId === c.id && styles.custChipTextActive]}>
              {c.name}
            </Text>
            {selectedCustomerId === c.id && <Check size={14} color="#ffffff" />}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Calculator Entry Pad */}
      <QuickCalculatorPad
        customerName={selectedCustomer?.name}
        onSaveTransaction={handleSaveTransaction}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 60 },
  title: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2, marginBottom: 16 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: 8 },
  custScroll: { marginBottom: 16 },
  custChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  custChipActive: { backgroundColor: '#2563eb', borderColor: '#1d4ed8' },
  custChipText: { fontSize: 13, fontWeight: '600', color: '#334155' },
  custChipTextActive: { color: '#ffffff' },
});
