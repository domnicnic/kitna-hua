import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Switch } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLedger } from '../context/LedgerContext';
import { AddStoreModal } from '../components/AddStoreModal';
import { EditCustomerModal } from '../components/EditCustomerModal';
import { StoreProfile, Customer } from '../types';
import { ShieldCheck, Store, Users, Wallet, Plus, Edit, ArrowRight, CheckCircle, Power } from 'lucide-react-native';

export const SuperAdminScreen: React.FC = () => {
  const { allStores, activeStoreId, setActiveStoreId, addNewStore, updateProfile, toggleStoreStatus } = useAuth();
  const { allCustomersGlobal, updateExistingCustomer, deleteCustomerAccount } = useLedger();

  const [activeSubTab, setActiveSubTab] = useState<'STORES' | 'CUSTOMERS'>('STORES');

  // Store Modals
  const [isAddStoreModalOpen, setIsAddStoreModalOpen] = useState<boolean>(false);
  const [editingStore, setEditingStore] = useState<StoreProfile | null>(null);

  // Customer Modals
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const totalGlobalAdvanceWallet = allCustomersGlobal.reduce((acc, c) => acc + (c.advance_balance || 0), 0);

  return (
    <View style={styles.container}>
      {/* Super Admin Top Banner */}
      <View style={styles.adminBanner}>
        <View style={styles.bannerRow}>
          <ShieldCheck size={28} color="#38bdf8" />
          <View style={styles.bannerTextCol}>
            <Text style={styles.bannerTitle}>Super Admin Control Center</Text>
            <Text style={styles.bannerSub}>Global Multi-Tenant Store & Customer Oversight</Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Total Shops</Text>
            <Text style={styles.metricVal}>{allStores.length}</Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Total Customers</Text>
            <Text style={styles.metricVal}>{allCustomersGlobal.length}</Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Advance Wallet</Text>
            <Text style={[styles.metricVal, { color: '#38bdf8' }]}>
              ₹{totalGlobalAdvanceWallet.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>
      </View>

      {/* Sub Tabs */}
      <View style={styles.subTabsRow}>
        <TouchableOpacity
          style={[styles.subTab, activeSubTab === 'STORES' && styles.subTabActive]}
          onPress={() => setActiveSubTab('STORES')}
        >
          <Store size={16} color={activeSubTab === 'STORES' ? '#ffffff' : '#64748b'} />
          <Text style={[styles.subTabText, activeSubTab === 'STORES' && styles.subTabTextActive]}>
            Stores Directory ({allStores.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTab, activeSubTab === 'CUSTOMERS' && styles.subTabActive]}
          onPress={() => setActiveSubTab('CUSTOMERS')}
        >
          <Users size={16} color={activeSubTab === 'CUSTOMERS' ? '#ffffff' : '#64748b'} />
          <Text style={[styles.subTabText, activeSubTab === 'CUSTOMERS' && styles.subTabTextActive]}>
            All Customers ({allCustomersGlobal.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* VIEW 1: STORES MANAGER */}
      {activeSubTab === 'STORES' && (
        <View style={{ flex: 1 }}>
          <View style={styles.actionHeader}>
            <Text style={styles.sectionTitle}>Registered Store Accounts</Text>
            <TouchableOpacity
              style={styles.addStoreBtn}
              onPress={() => {
                setEditingStore(null);
                setIsAddStoreModalOpen(true);
              }}
            >
              <Plus size={16} color="#ffffff" />
              <Text style={styles.addStoreBtnText}>Add New Store</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={allStores}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isActive = item.id === activeStoreId;

              return (
                <View style={[styles.storeCard, isActive && styles.activeStoreCard]}>
                  <View style={styles.storeCardTop}>
                    <View style={styles.storeMainInfo}>
                      <View style={styles.nameRow}>
                        <Text style={styles.storeNameText}>{item.store_name}</Text>
                        <View style={[styles.statusBadge, item.is_active ? styles.statusGreen : styles.statusRed]}>
                          <Text style={[styles.statusBadgeText, item.is_active ? styles.statusTextGreen : styles.statusTextRed]}>
                            {item.is_active ? 'ACTIVE' : 'DISABLED'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.ownerText}>Proprietor: {item.owner_name} | Tel: {item.phone}</Text>
                      {item.address ? <Text style={styles.addressText}>{item.address}</Text> : null}
                    </View>

                    <TouchableOpacity
                      style={styles.editIconBtn}
                      onPress={() => {
                        setEditingStore(item);
                        setIsAddStoreModalOpen(true);
                      }}
                    >
                      <Edit size={16} color="#2563eb" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.storeMetricsRow}>
                    <Text style={styles.storeStat}>
                      Customers: <Text style={{ fontWeight: '700', color: '#0f172a' }}>{item.total_customers || 0}</Text>
                    </Text>
                    <Text style={styles.storeStat}>
                      Total Udhaar: <Text style={{ fontWeight: '700', color: '#dc2626' }}>₹{item.total_udhaar || 0}</Text>
                    </Text>
                    <Text style={styles.storeStat}>
                      Advance Wallet: <Text style={{ fontWeight: '700', color: '#0284c7' }}>₹{item.total_advance || 0}</Text>
                    </Text>
                  </View>

                  <View style={styles.storeCardFooter}>
                    <View style={styles.toggleRow}>
                      <Text style={styles.toggleText}>Account Status:</Text>
                      <Switch
                        value={item.is_active}
                        onValueChange={async (val) => {
                          await toggleStoreStatus(item.id, val);
                        }}
                      />
                    </View>

                    <TouchableOpacity
                      style={[styles.switchBtn, isActive && styles.switchBtnActive]}
                      onPress={() => {
                        setActiveStoreId(item.id);
                        Alert.alert('Store Workspace Active', `Switched to ${item.store_name}.`);
                      }}
                    >
                      <Text style={[styles.switchBtnText, isActive && styles.switchBtnTextActive]}>
                        {isActive ? 'CURRENT WORKSPACE' : 'INSPECT STORE'}
                      </Text>
                      {!isActive && <ArrowRight size={14} color="#2563eb" />}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
            contentContainerStyle={styles.listContent}
          />
        </View>
      )}

      {/* VIEW 2: GLOBAL CUSTOMERS MANAGER */}
      {activeSubTab === 'CUSTOMERS' && (
        <View style={{ flex: 1 }}>
          <View style={styles.actionHeader}>
            <Text style={styles.sectionTitle}>Global Customers & Advance Wallets</Text>
          </View>

          <FlatList
            data={allCustomersGlobal}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const storeObj = allStores.find(s => s.id === item.store_id);

              return (
                <View style={styles.custCard}>
                  <View style={styles.custCardInfo}>
                    <Text style={styles.custNameText}>{item.name}</Text>
                    <Text style={styles.custPhoneText}>{item.phone}</Text>
                    <Text style={styles.storeTag}>Store: {storeObj?.store_name || `Store #${item.store_id}`}</Text>
                  </View>

                  <View style={styles.custRight}>
                    <View style={styles.walletBadge}>
                      <Wallet size={12} color="#0284c7" />
                      <Text style={styles.walletText}>Adv Wallet: ₹{item.advance_balance || 0}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.editCustBtn}
                      onPress={() => setEditingCustomer(item)}
                    >
                      <Edit size={16} color="#2563eb" />
                      <Text style={styles.editCustText}>Edit Customer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
            contentContainerStyle={styles.listContent}
          />
        </View>
      )}

      {/* Add / Edit Store Modal */}
      <AddStoreModal
        visible={isAddStoreModalOpen}
        onClose={() => setIsAddStoreModalOpen(false)}
        initialData={editingStore || undefined}
        onAddStore={async (storeData) => {
          await addNewStore(storeData);
          Alert.alert('Store Created!', `New store ${storeData.store_name} inserted successfully.`);
        }}
        onUpdateStore={async (storeData) => {
          await updateProfile(storeData);
          Alert.alert('Store Updated!', `Store ${storeData.store_name} details updated.`);
        }}
      />

      {/* Edit Customer Modal */}
      <EditCustomerModal
        visible={!!editingCustomer}
        customer={editingCustomer}
        onClose={() => setEditingCustomer(null)}
        onUpdate={async (updatedCustomer) => {
          await updateExistingCustomer(updatedCustomer);
          Alert.alert('Customer Updated!', `Customer ${updatedCustomer.name} updated.`);
        }}
        onDelete={async (customerId: string) => {
          await deleteCustomerAccount(customerId);
          Alert.alert('Customer Deleted!', 'Account removed.');
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  adminBanner: {
    backgroundColor: '#0f172a',
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  bannerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  bannerTextCol: { flex: 1 },
  bannerTitle: { fontSize: 20, fontWeight: '800', color: '#38bdf8' },
  bannerSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  metricsRow: { flexDirection: 'row', gap: 10 },
  metricItem: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  metricLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' },
  metricVal: { fontSize: 18, fontWeight: '800', color: '#ffffff', marginTop: 2 },
  subTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  subTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  subTabActive: { backgroundColor: '#2563eb', borderColor: '#1d4ed8' },
  subTabText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  subTabTextActive: { color: '#ffffff' },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  addStoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addStoreBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  listContent: { paddingHorizontal: 16, paddingBottom: 60 },
  storeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  activeStoreCard: { borderColor: '#2563eb', borderWidth: 2 },
  storeCardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  storeMainInfo: { flex: 1, marginRight: 10 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  storeNameText: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  statusGreen: { backgroundColor: '#dcfce7' },
  statusRed: { backgroundColor: '#fee2e2' },
  statusBadgeText: { fontSize: 9, fontWeight: '800' },
  statusTextGreen: { color: '#16a34a' },
  statusTextRed: { color: '#dc2626' },
  ownerText: { fontSize: 12, color: '#64748b', marginTop: 4 },
  addressText: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  editIconBtn: { backgroundColor: '#eff6ff', padding: 8, borderRadius: 8 },
  storeMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 8,
    marginVertical: 10,
  },
  storeStat: { fontSize: 11, color: '#64748b' },
  storeCardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toggleText: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  switchBtnActive: { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' },
  switchBtnText: { fontSize: 11, fontWeight: '700', color: '#2563eb' },
  switchBtnTextActive: { color: '#64748b' },
  custCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  custCardInfo: { flex: 1 },
  custNameText: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  custPhoneText: { fontSize: 12, color: '#64748b', marginTop: 2 },
  storeTag: { fontSize: 11, color: '#2563eb', fontWeight: '600', marginTop: 2 },
  custRight: { alignItems: 'flex-end', gap: 6 },
  walletBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e0f2fe', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, gap: 2 },
  walletText: { fontSize: 10, fontWeight: '700', color: '#0284c7' },
  editCustBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
  editCustText: { fontSize: 11, fontWeight: '700', color: '#2563eb' },
});
