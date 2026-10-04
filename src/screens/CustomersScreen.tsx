import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useLedger, FilterCategory } from '../context/LedgerContext';
import { CustomerCard } from '../components/CustomerCard';
import { AddCustomerModal } from '../components/AddCustomerModal';
import { DispatchesModal } from '../components/DispatchesModal';
import { generateMonthlySlipText, sendWhatsAppMessage } from '../services/whatsappService';
import { useAuth } from '../context/AuthContext';
import { Search, UserPlus, Send, AlertCircle } from 'lucide-react-native';
import { Customer } from '../types';

interface CustomersScreenProps {
  onSelectCustomer: (customerId: string) => void;
  onOpenBilling: (customerId?: string) => void;
}

export const CustomersScreen: React.FC<CustomersScreenProps> = ({
  onSelectCustomer,
  onOpenBilling
}) => {
  const {
    filteredCustomers,
    searchQuery,
    setSearchQuery,
    filterCategory,
    setFilterCategory,
    addNewCustomer,
    monthlyDispatches,
    selectedMonth
  } = useLedger();
  const { storeProfile } = useAuth();

  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState<boolean>(false);

  const filterTabs: { label: string; key: FilterCategory }[] = [
    { label: 'All Accounts', key: 'ALL' },
    { label: 'Pending Dues', key: 'PENDING' },
    { label: 'In Advance', key: 'ADVANCE' },
    { label: 'Clear', key: 'CLEAR' },
  ];

  const handleWhatsAppInstant = (customer: Customer) => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const [yr, mo] = selectedMonth.split('-');
    const mName = `${monthNames[parseInt(mo, 10) - 1]} ${yr}`;

    const text = generateMonthlySlipText({
      customer,
      storeName: storeProfile?.store_name || 'Store',
      monthName: mName,
      openingBalance: 0,
      monthlyPurchases: customer.total_udhaar || 0,
      monthlyPayments: customer.total_jama || 0,
      closingBalance: customer.current_balance || 0
    });

    sendWhatsAppMessage(customer.phone, text);
  };

  return (
    <View style={styles.container}>
      {/* 1st of Month Reminder Banner */}
      {monthlyDispatches.some(d => d.closingBalance !== 0) && (
        <TouchableOpacity
          style={styles.dispatchBanner}
          onPress={() => setIsDispatchModalOpen(true)}
          activeOpacity={0.85}
        >
          <View style={styles.bannerLeft}>
            <AlertCircle size={20} color="#d97706" />
            <View style={styles.bannerTextCol}>
              <Text style={styles.bannerTitle}>Monthly Dispatch Ready</Text>
              <Text style={styles.bannerSub}>Send 1-click WhatsApp monthly statement slips to customers.</Text>
            </View>
          </View>
          <View style={styles.bannerBadge}>
            <Send size={12} color="#ffffff" />
            <Text style={styles.bannerBadgeText}>DISPATCH</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={18} color="#64748b" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Customer Name or Phone..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        {filterTabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterTab, filterCategory === tab.key && styles.filterTabActive]}
            onPress={() => setFilterCategory(tab.key)}
          >
            <Text style={[styles.filterTabText, filterCategory === tab.key && styles.filterTabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Customers List */}
      <FlatList
        data={filteredCustomers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CustomerCard
            customer={item}
            onPress={() => onSelectCustomer(item.id)}
            onWhatsAppPress={() => handleWhatsAppInstant(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No customers found</Text>
            <Text style={styles.emptySubText}>Add a new customer to start recording daily Udhaar & Jama.</Text>
          </View>
        }
      />

      {/* Add Customer FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsAddModalOpen(true)}
        activeOpacity={0.85}
      >
        <UserPlus size={22} color="#ffffff" />
        <Text style={styles.fabText}>Add Customer</Text>
      </TouchableOpacity>

      {/* Modals */}
      <AddCustomerModal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={async (name, phone, address, creditLimit, initialAdvance) => {
          try {
            await addNewCustomer(name, phone, address, creditLimit, initialAdvance);
          } catch (err: any) {
            Alert.alert('Cannot Add Customer', err.message || 'Failed to add customer account.');
          }
        }}
      />

      <DispatchesModal
        visible={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        dispatches={monthlyDispatches}
        monthName={selectedMonth}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  dispatchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400e',
  },
  bannerSub: {
    fontSize: 11,
    color: '#b45309',
    marginTop: 2,
  },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d97706',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  bannerBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  filterTabActive: {
    backgroundColor: '#2563eb',
    borderColor: '#1d4ed8',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterTabTextActive: {
    color: '#ffffff',
  },
  listContent: {
    paddingBottom: 90,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
  },
  emptySubText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    gap: 8,
  },
  fabText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
