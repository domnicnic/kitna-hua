import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Alert } from 'react-native';
import { StoreProfile } from '../types';
import { Store, User, Phone, MapPin, Lock, X, CheckCircle } from 'lucide-react-native';

interface AddStoreModalProps {
  visible: boolean;
  onClose: () => void;
  onAddStore: (storeData: Omit<StoreProfile, 'id'>) => void;
  initialData?: StoreProfile;
  onUpdateStore?: (storeData: StoreProfile) => void;
}

export const AddStoreModal: React.FC<AddStoreModalProps> = ({
  visible,
  onClose,
  onAddStore,
  initialData,
  onUpdateStore
}) => {
  const isEditing = !!initialData;

  const [storeName, setStoreName] = useState(initialData?.store_name || '');
  const [ownerName, setOwnerName] = useState(initialData?.owner_name || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [pinHash, setPinHash] = useState(initialData?.pin_hash || '1234');

  const handleSave = () => {
    if (!storeName.trim() || !ownerName.trim()) {
      Alert.alert('Required Fields', 'Please enter store name and owner name.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      Alert.alert('Valid Phone Required', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    if (isEditing && initialData && onUpdateStore) {
      onUpdateStore({
        ...initialData,
        store_name: storeName.trim(),
        owner_name: ownerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        pin_hash: pinHash.trim()
      });
    } else {
      onAddStore({
        store_name: storeName.trim(),
        owner_name: ownerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        pin_hash: pinHash.trim(),
        is_pin_enabled: true,
        is_active: true
      });
    }

    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{isEditing ? 'Edit Store Profile' : 'Add New Store'}</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Store / Shop Name *</Text>
            <View style={styles.inputBox}>
              <Store size={18} color="#64748b" />
              <TextInput
                style={styles.input}
                placeholder="e.g. Mahavir Groceries"
                value={storeName}
                onChangeText={setStoreName}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Owner / Proprietor Name *</Text>
            <View style={styles.inputBox}>
              <User size={18} color="#64748b" />
              <TextInput
                style={styles.input}
                placeholder="e.g. Anil Kumar"
                value={ownerName}
                onChangeText={setOwnerName}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Contact Phone Number *</Text>
            <View style={styles.inputBox}>
              <Phone size={18} color="#64748b" />
              <TextInput
                style={styles.input}
                placeholder="e.g. 9811223344"
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Store Address</Text>
            <View style={styles.inputBox}>
              <MapPin size={18} color="#64748b" />
              <TextInput
                style={styles.input}
                placeholder="e.g. Market Road, Sector 4"
                value={address}
                onChangeText={setAddress}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Default Store Security PIN</Text>
            <View style={styles.inputBox}>
              <Lock size={18} color="#64748b" />
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                maxLength={4}
                value={pinHash}
                onChangeText={setPinHash}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
            <CheckCircle size={18} color="#ffffff" />
            <Text style={styles.submitBtnText}>{isEditing ? 'UPDATE STORE' : 'INSERT NEW STORE'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#0f172a',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
