import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Alert, Switch, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { db } from '../database/db';
import { sendWhatsAppMessage } from '../services/whatsappService';
import { Store, User, Phone, MapPin, Shield, Lock, Download, Upload, CheckCircle2, ShieldAlert, Trash2, KeyRound } from 'lucide-react-native';

export const SettingsScreen: React.FC = () => {
  const { storeProfile, role, updateProfile, superAdminPin, updateSuperAdminPin, resetApplicationData } = useAuth();

  const [storeName, setStoreName] = useState(storeProfile?.store_name || '');
  const [ownerName, setOwnerName] = useState(storeProfile?.owner_name || '');
  const [phone, setPhone] = useState(storeProfile?.phone || '');
  const [address, setAddress] = useState(storeProfile?.address || '');
  const [pinHash, setPinHash] = useState(storeProfile?.pin_hash || '1234');
  const [isPinEnabled, setIsPinEnabled] = useState(storeProfile?.is_pin_enabled !== false);
  const [backupJSON, setBackupJSON] = useState('');

  // Super Admin PIN State
  const [superPinInput, setSuperPinInput] = useState(superAdminPin || '9999');

  useEffect(() => {
    if (storeProfile) {
      setStoreName(storeProfile.store_name);
      setOwnerName(storeProfile.owner_name);
      setPhone(storeProfile.phone);
      setAddress(storeProfile.address || '');
      setPinHash(storeProfile.pin_hash || '1234');
      setIsPinEnabled(storeProfile.is_pin_enabled !== false);
    }
  }, [storeProfile]);

  useEffect(() => {
    setSuperPinInput(superAdminPin);
  }, [superAdminPin]);

  const handleSaveProfile = async () => {
    if (!storeProfile) {
      Alert.alert('No Store Selected', 'Please select or register a store account first.');
      return;
    }
    if (!storeName.trim() || !ownerName.trim()) {
      Alert.alert('Store Details Required', 'Please enter store name and owner name.');
      return;
    }

    await updateProfile({
      ...storeProfile,
      store_name: storeName.trim(),
      owner_name: ownerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      pin_hash: pinHash.trim(),
      is_pin_enabled: isPinEnabled
    });

    Alert.alert('Profile Saved!', 'Store details updated successfully.');
  };

  const handleSaveSuperAdminPin = async () => {
    if (!superPinInput || superPinInput.length !== 4) {
      Alert.alert('Invalid PIN', 'Super Admin PIN must be exactly 4 digits.');
      return;
    }
    const ok = await updateSuperAdminPin(superPinInput.trim());
    if (ok) {
      Alert.alert('Super Admin Security Updated', 'New Super Admin Security PIN saved.');
    }
  };

  const handlePurgeAllData = () => {
    Alert.alert(
      'Purge All Application Data?',
      'WARNING: This will permanently delete all registered stores, customers, transactions, and reset the app to a clean initial state. This action cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'PERMANENTLY PURGE DATA',
          style: 'destructive',
          onPress: async () => {
            await resetApplicationData();
            Alert.alert('Data Purged', 'All dummy and existing application data has been completely removed.');
          }
        }
      ]
    );
  };

  const handleExportBackup = async () => {
    const jsonStr = await db.exportDatabaseJSON();
    setBackupJSON(jsonStr);

    Alert.alert(
      'Backup Created!',
      'Database JSON export generated. Share backup file or text via WhatsApp?',
      [
        { text: 'Copy / Close', style: 'cancel' },
        {
          text: 'Send via WhatsApp',
          onPress: () => {
            const backupSummary = `Kitna Hua Backup Export:\nDate: ${new Date().toLocaleString()}\nStore: ${storeProfile?.store_name || 'All Stores'}\nData: ${jsonStr.slice(0, 300)}...`;
            sendWhatsAppMessage(storeProfile?.phone || '', backupSummary);
          }
        }
      ]
    );
  };

  const handleImportBackup = async () => {
    if (!backupJSON.trim()) {
      Alert.alert('Paste Backup JSON', 'Please paste the backup JSON text in the box below to restore.');
      return;
    }

    const success = await db.importDatabaseJSON(backupJSON);
    if (success) {
      Alert.alert('Backup Restored!', 'Store database restored successfully.');
      setBackupJSON('');
    } else {
      Alert.alert('Restore Failed', 'Invalid JSON backup format.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings & Security</Text>
      <Text style={styles.subtitle}>Configure store profile, security PIN, and database backup.</Text>

      {/* App Branding Card */}
      <View style={styles.brandingCard}>
        <Image
          source={require('../../assets/logo.jpg')}
          style={styles.logoImage}
          resizeMode="cover"
        />
        <View style={styles.brandingTextCol}>
          <Text style={styles.appName}>Kitna Hua</Text>
          <Text style={styles.appTagline}>Universal Digital Khata & Billing Application</Text>
          <Text style={styles.appVersion}>Version 2.0.0 • Offline-First Encrypted Multi-Tenant</Text>
        </View>
      </View>

      {/* Super Admin Security Section (if Super Admin role) */}
      {role === 'SUPER_ADMIN' && (
        <>
          <Text style={styles.sectionHeader}>Super Admin Master Security</Text>
          <View style={[styles.card, { borderColor: '#0284c7' }]}>
            <View style={styles.adminHeaderRow}>
              <ShieldAlert size={20} color="#0284c7" />
              <Text style={styles.adminCardTitle}>Super Admin Master Access PIN</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Super Admin 4-Digit Security PIN (Default: 9999)</Text>
              <View style={styles.inputBox}>
                <KeyRound size={18} color="#0284c7" />
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  secureTextEntry
                  maxLength={4}
                  value={superPinInput}
                  onChangeText={setSuperPinInput}
                />
              </View>
            </View>

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#0284c7' }]} onPress={handleSaveSuperAdminPin}>
              <CheckCircle2 size={18} color="#ffffff" />
              <Text style={styles.saveBtnText}>UPDATE SUPER ADMIN PIN</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Store Profile Section */}
      {storeProfile ? (
        <>
          <Text style={styles.sectionHeader}>Store Profile Information</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Store Name *</Text>
              <View style={styles.inputBox}>
                <Store size={18} color="#64748b" />
                <TextInput style={styles.input} value={storeName} onChangeText={setStoreName} />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Owner Name *</Text>
              <View style={styles.inputBox}>
                <User size={18} color="#64748b" />
                <TextInput style={styles.input} value={ownerName} onChangeText={setOwnerName} />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Phone Number *</Text>
              <View style={styles.inputBox}>
                <Phone size={18} color="#64748b" />
                <TextInput style={styles.input} keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Store Address</Text>
              <View style={styles.inputBox}>
                <MapPin size={18} color="#64748b" />
                <TextInput style={styles.input} value={address} onChangeText={setAddress} />
              </View>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
              <CheckCircle2 size={18} color="#ffffff" />
              <Text style={styles.saveBtnText}>SAVE STORE PROFILE</Text>
            </TouchableOpacity>
          </View>

          {/* Security & PIN Section */}
          <Text style={styles.sectionHeader}>App Security & Biometrics</Text>
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>Enable Store PIN / Biometrics Lock</Text>
                <Text style={styles.switchSub}>Require 4-digit PIN on opening application</Text>
              </View>
              <Switch value={isPinEnabled} onValueChange={setIsPinEnabled} />
            </View>

            {isPinEnabled && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>4-Digit Store Security PIN</Text>
                <View style={styles.inputBox}>
                  <Lock size={18} color="#64748b" />
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    secureTextEntry
                    maxLength={4}
                    value={pinHash}
                    onChangeText={setPinHash}
                  />
                </View>
              </View>
            )}
          </View>
        </>
      ) : null}

      {/* Backup & Restore Section */}
      <Text style={styles.sectionHeader}>Encrypted Backup & Restore</Text>
      <View style={styles.card}>
        <Text style={styles.backupSub}>
          Export database as encrypted JSON to WhatsApp or local files without any gateway fees.
        </Text>

        <View style={styles.backupBtnRow}>
          <TouchableOpacity style={styles.backupBtn} onPress={handleExportBackup}>
            <Download size={16} color="#ffffff" />
            <Text style={styles.backupBtnText}>Export JSON Backup</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.backupBtn, styles.restoreBtn]} onPress={handleImportBackup}>
            <Upload size={16} color="#0f172a" />
            <Text style={[styles.backupBtnText, { color: '#0f172a' }]}>Restore Backup</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.jsonInput}
          multiline
          placeholder="Backup JSON output will appear here, or paste JSON here to restore..."
          value={backupJSON}
          onChangeText={setBackupJSON}
        />
      </View>

      {/* Data Purge Section */}
      <Text style={styles.sectionHeader}>Database Management</Text>
      <View style={[styles.card, { borderColor: '#fca5a5' }]}>
        <Text style={styles.purgeLabel}>Reset & Purge All Application Data</Text>
        <Text style={styles.purgeSub}>
          Completely wipe all stores, customer ledgers, transactions, and dummy data to start completely fresh.
        </Text>
        <TouchableOpacity style={styles.purgeBtn} onPress={handlePurgeAllData}>
          <Trash2 size={18} color="#ffffff" />
          <Text style={styles.purgeBtnText}>PURGE ALL DATA</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 60 },
  title: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2, marginBottom: 16 },
  brandingCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  logoImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#d97706',
  },
  brandingTextCol: { flex: 1 },
  appName: { fontSize: 20, fontWeight: '800', color: '#38bdf8' },
  appTagline: { fontSize: 12, color: '#ffffff', fontWeight: '600', marginTop: 2 },
  appVersion: { fontSize: 10, color: '#94a3b8', marginTop: 4 },
  sectionHeader: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 10, marginTop: 4 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  adminHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  adminCardTitle: { fontSize: 15, fontWeight: '700', color: '#0284c7' },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 4 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  input: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 14, color: '#0f172a' },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
    gap: 8,
  },
  saveBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  switchLabel: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  switchSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  backupSub: { fontSize: 12, color: '#64748b', marginBottom: 12 },
  backupBtnRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  backupBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  restoreBtn: { backgroundColor: '#e2e8f0' },
  backupBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  jsonInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 10,
    height: 90,
    fontSize: 11,
    color: '#334155',
  },
  purgeLabel: { fontSize: 14, fontWeight: '700', color: '#dc2626' },
  purgeSub: { fontSize: 12, color: '#64748b', marginTop: 2, marginBottom: 12 },
  purgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  purgeBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
});
