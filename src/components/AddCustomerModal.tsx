import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Alert } from 'react-native';
import { User, Phone, MapPin, Wallet, X, CheckCircle } from 'lucide-react-native';

interface AddCustomerModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (name: string, phone: string, address?: string, creditLimit?: number, initialAdvance?: number) => void;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  visible,
  onClose,
  onAdd
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [initialAdvance, setInitialAdvance] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Customer Name Required', 'Please enter customer full name.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      Alert.alert('Valid Phone Required', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    onAdd(
      name.trim(),
      phone.trim(),
      address.trim(),
      creditLimit ? parseFloat(creditLimit) : 0,
      initialAdvance ? parseFloat(initialAdvance) : 0
    );

    setName('');
    setPhone('');
    setAddress('');
    setCreditLimit('');
    setInitialAdvance('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Add New Customer Account</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <View style={styles.inputBox}>
              <User size={18} color="#64748b" />
              <TextInput
                style={styles.input}
                placeholder="e.g. Rajesh Kumar"
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number (WhatsApp) *</Text>
            <View style={styles.inputBox}>
              <Phone size={18} color="#64748b" />
              <TextInput
                style={styles.input}
                placeholder="e.g. 9876543210"
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Address (Optional)</Text>
            <View style={styles.inputBox}>
              <MapPin size={18} color="#64748b" />
              <TextInput
                style={styles.input}
                placeholder="e.g. Flat 204, Main Market"
                value={address}
                onChangeText={setAddress}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Credit Limit (₹)</Text>
              <TextInput
                style={styles.numInput}
                placeholder="e.g. 5000"
                keyboardType="numeric"
                value={creditLimit}
                onChangeText={setCreditLimit}
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Initial Advance (₹)</Text>
              <TextInput
                style={styles.numInput}
                placeholder="e.g. 500"
                keyboardType="numeric"
                value={initialAdvance}
                onChangeText={setInitialAdvance}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
            <CheckCircle size={18} color="#ffffff" />
            <Text style={styles.submitBtnText}>CREATE CUSTOMER ACCOUNT</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
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
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  numInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
