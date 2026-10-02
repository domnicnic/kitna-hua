import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLedger } from '../context/LedgerContext';
import { useAuth } from '../context/AuthContext';
import { exportPDF } from '../services/pdfService';
import { FileText, Download, Calendar, TrendingUp, TrendingDown, Users } from 'lucide-react-native';

export const MonthlyReportsScreen: React.FC = () => {
  const { selectedMonth, metrics, customers, transactions } = useLedger();
  const { storeProfile } = useAuth();

  const handleExportFullStorePDF = async () => {
    await exportPDF({
      storeProfile: storeProfile || undefined,
      transactions,
      billingMonth: selectedMonth,
      openingBalance: 0,
      closingBalance: metrics.netPendingBalance
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Monthly Reports & Statements</Text>
      <Text style={styles.subtitle}>Consolidated store ledger statement for {selectedMonth}.</Text>

      {/* Primary Export Banner */}
      <View style={styles.exportCard}>
        <View style={styles.exportLeft}>
          <FileText size={32} color="#38bdf8" />
          <View style={styles.exportCol}>
            <Text style={styles.exportTitle}>Download Full Store PDF</Text>
            <Text style={styles.exportSub}>Export complete month transaction ledger & balance sheet.</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExportFullStorePDF}>
          <Download size={16} color="#ffffff" />
          <Text style={styles.exportBtnText}>EXPORT PDF</Text>
        </TouchableOpacity>
      </View>

      {/* Month Metrics Breakdown */}
      <Text style={styles.sectionHeader}>Monthly Summary Metrics</Text>
      <View style={styles.grid}>
        <View style={[styles.statBox, styles.statRed]}>
          <TrendingUp size={20} color="#dc2626" />
          <Text style={styles.statLabel}>Total Udhaar Given</Text>
          <Text style={[styles.statVal, { color: '#dc2626' }]}>
            ₹{metrics.totalUdhaarGiven.toLocaleString('en-IN')}
          </Text>
        </View>

        <View style={[styles.statBox, styles.statGreen]}>
          <TrendingDown size={20} color="#16a34a" />
          <Text style={styles.statLabel}>Total Jama Received</Text>
          <Text style={[styles.statVal, { color: '#16a34a' }]}>
            ₹{metrics.totalJamaReceived.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={[styles.statBox, styles.statBlue]}>
          <Users size={20} color="#2563eb" />
          <Text style={styles.statLabel}>Active Customers</Text>
          <Text style={[styles.statVal, { color: '#2563eb' }]}>{customers.length}</Text>
        </View>

        <View style={[styles.statBox, styles.statAmber]}>
          <Calendar size={20} color="#d97706" />
          <Text style={styles.statLabel}>Month Transactions</Text>
          <Text style={[styles.statVal, { color: '#d97706' }]}>{transactions.length}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 60 },
  title: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2, marginBottom: 16 },
  exportCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  exportLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 10 },
  exportCol: { flex: 1 },
  exportTitle: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
  exportSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  exportBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  sectionHeader: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  grid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statRed: { borderLeftWidth: 4, borderLeftColor: '#ef4444' },
  statGreen: { borderLeftWidth: 4, borderLeftColor: '#22c55e' },
  statBlue: { borderLeftWidth: 4, borderLeftColor: '#3b82f6' },
  statAmber: { borderLeftWidth: 4, borderLeftColor: '#f59e0b' },
  statLabel: { fontSize: 11, fontWeight: '600', color: '#64748b', marginTop: 8 },
  statVal: { fontSize: 18, fontWeight: '800', marginTop: 2 },
});
