import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useLedger } from '../context/LedgerContext';
import { Wallet, ArrowDownLeft } from 'lucide-react-native';

interface AdvanceWalletScreenProps {
  onSelectCustomer: (customerId: string) => void;
}

export const AdvanceWalletScreen: React.FC<AdvanceWalletScreenProps> = ({ onSelectCustomer }) => {
  const { customers } = useLedger();

  const advanceCustomers = customers.filter(c => c.advance_balance > 0);
  const totalAdvanceWallet = advanceCustomers.reduce((acc, c) => acc + c.advance_balance, 0);

  return (
    <View style={styles.container}>
      {/* Top Advance Wallet Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryLabel}>TOTAL ADVANCE WALLET DEPOSITS</Text>
            <Text style={styles.summaryVal}>₹{totalAdvanceWallet.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.walletIconBox}>
            <Wallet size={28} color="#0284c7" />
          </View>
        </View>
        <Text style={styles.summaryDesc}>
          Customer pre-paid balances automatically deduct upcoming billing items.
        </Text>
      </View>

      <Text style={styles.sectionHeader}>Customers with Advance Deposit ({advanceCustomers.length})</Text>

      <FlatList
        data={advanceCustomers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => onSelectCustomer(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.phone}>{item.phone}</Text>
            </View>

            <View style={styles.valCol}>
              <View style={styles.badge}>
                <ArrowDownLeft size={12} color="#0284c7" />
                <Text style={styles.badgeText}>WALLET</Text>
              </View>
              <Text style={styles.advanceAmount}>₹{item.advance_balance.toLocaleString('en-IN')}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Wallet size={40} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No Advance Deposits Yet</Text>
            <Text style={styles.emptySub}>When customers deposit advance cash, record it as 'ADVANCE (Wallet)' in billing.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  summaryCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.5 },
  summaryVal: { fontSize: 28, fontWeight: '800', color: '#38bdf8', marginTop: 4 },
  walletIconBox: { backgroundColor: '#1e293b', padding: 10, borderRadius: 14, borderWidth: 1, borderColor: '#334155' },
  summaryDesc: { fontSize: 12, color: '#64748b', marginTop: 12, borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 10 },
  sectionHeader: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  phone: { fontSize: 12, color: '#64748b', marginTop: 2 },
  valCol: { alignItems: 'flex-end' },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e0f2fe', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, gap: 2 },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#0284c7' },
  advanceAmount: { fontSize: 16, fontWeight: '800', color: '#0284c7', marginTop: 4 },
  emptyContainer: { alignItems: 'center', paddingVertical: 50 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#475569', marginTop: 10 },
  emptySub: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 4, paddingHorizontal: 20 },
});
