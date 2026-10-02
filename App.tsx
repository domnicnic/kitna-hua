import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar, Modal, ScrollView, Platform } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LedgerProvider, useLedger } from './src/context/LedgerContext';
import { Header } from './src/components/Header';
import { PinLockScreen } from './src/components/PinLockScreen';
import { CustomersScreen } from './src/screens/CustomersScreen';
import { CustomerDetailScreen } from './src/screens/CustomerDetailScreen';
import { DailyBillingScreen } from './src/screens/DailyBillingScreen';
import { AdvanceWalletScreen } from './src/screens/AdvanceWalletScreen';
import { MonthlyReportsScreen } from './src/screens/MonthlyReportsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SuperAdminScreen } from './src/screens/SuperAdminScreen';
import { Users, Calculator, Wallet, BarChart3, Settings, ShieldCheck, Check, X } from 'lucide-react-native';

type NavigationTab = 'CUSTOMERS' | 'BILLING' | 'ADVANCE' | 'REPORTS' | 'SETTINGS' | 'SUPER_ADMIN';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('CUSTOMERS');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState<boolean>(false);

  const { selectedMonth, setSelectedMonth } = useLedger();
  const { role } = useAuth();

  // Strict RBAC Route Guard: Redirect Store Admin away from Super Admin tab if unauthorized
  useEffect(() => {
    if (role !== 'SUPER_ADMIN' && activeTab === 'SUPER_ADMIN') {
      setActiveTab('CUSTOMERS');
    }
  }, [role, activeTab]);

  const generateAvailableMonths = () => {
    const list: string[] = [];
    const date = new Date();
    for (let i = 0; i < 12; i++) {
      const yr = date.getFullYear();
      const mo = String(date.getMonth() + 1).padStart(2, '0');
      list.push(`${yr}-${mo}`);
      date.setMonth(date.getMonth() - 1);
    }
    return list;
  };

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <PinLockScreen />

      {/* Show Customer Detail Screen if customer selected */}
      {selectedCustomerId !== null ? (
        <CustomerDetailScreen
          customerId={selectedCustomerId}
          onBack={() => setSelectedCustomerId(null)}
        />
      ) : (
        <View style={styles.mainContainer}>
          {/* Global Header */}
          <Header
            onOpenMonthSelector={() => setIsMonthPickerOpen(true)}
          />

          {/* Active Tab View */}
          <View style={styles.viewBody}>
            {activeTab === 'CUSTOMERS' && (
              <CustomersScreen
                onSelectCustomer={handleSelectCustomer}
                onOpenBilling={(cId) => {
                  if (cId) setSelectedCustomerId(cId);
                  else setActiveTab('BILLING');
                }}
              />
            )}
            {activeTab === 'BILLING' && <DailyBillingScreen />}
            {activeTab === 'ADVANCE' && (
              <AdvanceWalletScreen onSelectCustomer={handleSelectCustomer} />
            )}
            {activeTab === 'REPORTS' && <MonthlyReportsScreen />}
            {activeTab === 'SETTINGS' && <SettingsScreen />}
            {activeTab === 'SUPER_ADMIN' && role === 'SUPER_ADMIN' && <SuperAdminScreen />}
          </View>

          {/* Bottom Navigation Bar */}
          <View style={styles.navBar}>
            <TouchableOpacity
              style={[styles.navItem, activeTab === 'CUSTOMERS' && styles.navItemActive]}
              onPress={() => setActiveTab('CUSTOMERS')}
            >
              <Users size={20} color={activeTab === 'CUSTOMERS' ? '#2563eb' : '#64748b'} />
              <Text style={[styles.navText, activeTab === 'CUSTOMERS' && styles.navTextActive]}>
                Customers
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navItem, activeTab === 'BILLING' && styles.navItemActive]}
              onPress={() => setActiveTab('BILLING')}
            >
              <Calculator size={20} color={activeTab === 'BILLING' ? '#2563eb' : '#64748b'} />
              <Text style={[styles.navText, activeTab === 'BILLING' && styles.navTextActive]}>
                Billing
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navItem, activeTab === 'ADVANCE' && styles.navItemActive]}
              onPress={() => setActiveTab('ADVANCE')}
            >
              <Wallet size={20} color={activeTab === 'ADVANCE' ? '#2563eb' : '#64748b'} />
              <Text style={[styles.navText, activeTab === 'ADVANCE' && styles.navTextActive]}>
                Advance
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navItem, activeTab === 'REPORTS' && styles.navItemActive]}
              onPress={() => setActiveTab('REPORTS')}
            >
              <BarChart3 size={20} color={activeTab === 'REPORTS' ? '#2563eb' : '#64748b'} />
              <Text style={[styles.navText, activeTab === 'REPORTS' && styles.navTextActive]}>
                Reports
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navItem, activeTab === 'SETTINGS' && styles.navItemActive]}
              onPress={() => setActiveTab('SETTINGS')}
            >
              <Settings size={20} color={activeTab === 'SETTINGS' ? '#2563eb' : '#64748b'} />
              <Text style={[styles.navText, activeTab === 'SETTINGS' && styles.navTextActive]}>
                Settings
              </Text>
            </TouchableOpacity>

            {/* Strict RBAC Guard: Super Admin tab ONLY rendered for SUPER_ADMIN role */}
            {role === 'SUPER_ADMIN' && (
              <TouchableOpacity
                style={[styles.navItem, activeTab === 'SUPER_ADMIN' && styles.navItemActive]}
                onPress={() => setActiveTab('SUPER_ADMIN')}
              >
                <ShieldCheck size={20} color={activeTab === 'SUPER_ADMIN' ? '#0284c7' : '#64748b'} />
                <Text style={[styles.navText, activeTab === 'SUPER_ADMIN' && styles.navTextActiveSuper]}>
                  Admin
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Month Selector Modal */}
      <Modal visible={isMonthPickerOpen} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.monthCard}>
            <View style={styles.monthHeader}>
              <Text style={styles.monthTitle}>Select Billing Month</Text>
              <TouchableOpacity onPress={() => setIsMonthPickerOpen(false)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300 }}>
              {generateAvailableMonths().map(mStr => {
                const [yr, mo] = mStr.split('-');
                const d = new Date(parseInt(yr, 10), parseInt(mo, 10) - 1, 1);
                const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                const isSel = selectedMonth === mStr;

                return (
                  <TouchableOpacity
                    key={mStr}
                    style={[styles.monthRow, isSel && styles.monthRowSel]}
                    onPress={() => {
                      setSelectedMonth(mStr);
                      setIsMonthPickerOpen(false);
                    }}
                  >
                    <Text style={[styles.monthText, isSel && styles.monthTextSel]}>{label}</Text>
                    {isSel && <Check size={18} color="#2563eb" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <LedgerProvider>
        <AppContent />
      </LedgerProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  viewBody: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingVertical: 8,
    paddingHorizontal: 4,
    ...Platform.select({
      web: { boxShadow: '0px -2px 8px rgba(0, 0, 0, 0.05)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 8,
      }
    })
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  navItemActive: {},
  navText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 4,
  },
  navTextActive: {
    color: '#2563eb',
    fontWeight: '700',
  },
  navTextActiveSuper: {
    color: '#0284c7',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  monthCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    ...Platform.select({
      web: { boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.15)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
      }
    })
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
    marginBottom: 12,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  monthRowSel: {
    backgroundColor: '#eff6ff',
  },
  monthText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  monthTextSel: {
    color: '#2563eb',
    fontWeight: '700',
  },
});
