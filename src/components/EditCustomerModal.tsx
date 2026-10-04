import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform
} from 'react-native';
import { Customer } from '../types';
import { User, Phone, MapPin, Wallet, X, CheckCircle, Trash2 } from 'lucide-react-native';

interface EditCustomerModalProps {
  visible: boolean;
  customer: Customer | null;
  onClose: () => void;
  onUpdate: (updatedCustomer: Customer) => void;
  onDelete?: (customerId: string) => void;
}

export const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  visible,
  customer,
  onClose,
  onUpdate,
  onDelete
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [advanceBalance, setAdvanceBalance] = useState('');

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone);
      setAddress(customer.address || '');
      setCreditLimit(customer.credit_limit ? customer.credit_limit.toString() : '0');
      setAdvanceBalance(customer.advance_balance ? customer.advance_balance.toString() : '0');
    }
  }, [customer]);

  if (!customer) return null;

  const handleSave = () => {
    const cleanName = name.trim();
    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');

    if (!cleanName) {
      Alert.alert('Name Required', 'Please enter customer full name.');
      return;
    }
    if (!cleanPhone || cleanPhone.length !== 10) {
      Alert.alert('Valid 10-Digit Phone Required', 'Please enter valid 10-digit phone number.');
      return;
    }

    onUpdate({
      ...customer,
      name: cleanName,
      phone: cleanPhone,
      address: address.trim(),
      credit_limit: creditLimit ? parseFloat(creditLimit) || 0.0 : 0.0,
      advance_balance: advanceBalance ? parseFloat(advanceBalance) || 0.0 : 0.0
    });

    onClose();
  };

  const handleDelete = () => {
    const activeBalance = customer.current_balance || 0;
    if (activeBalance !== 0) {
      Alert.alert(
        'Cannot Delete Account',
        `Account for ${customer.name} has an active balance of ₹${Math.abs(activeBalance)} ${activeBalance > 0 ? '(Pending Udhaar)' : '(Advance Deposit)'}. Please settle balance to ₹0 before deleting.`
      );
      return;
    }

    Alert.alert(
      'Delete Customer Account?',
      `Are you sure you want to permanently delete ${customer.name}? All ledger records will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            if (onDelete) onDelete(customer.id);
            onClose();
          }
        }
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ width: '100%' }}
          >
            <View style={styles.card}>
              <View style={styles.header}>
                <Text style={styles.title}>Edit Customer Account</Text>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Full Name *</Text>
                <View style={styles.inputBox}>
                  <User size={18} color="#64748b" />
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone Number (10 Digits) *</Text>
                <View style={styles.inputBox}>
                  <Phone size={18} color="#64748b" />
                  <TextInput
                    style={styles.input}
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Address</Text>
                <View style={styles.inputBox}>
                  <MapPin size={18} color="#64748b" />
                  <TextInput
                    style={styles.input}
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
                    keyboardType="numeric"
                    value={creditLimit}
                    onChangeText={setCreditLimit}
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Advance Wallet (₹)</Text>
                  <TextInput
                    style={styles.numInput}
                    keyboardType="numeric"
                    value={advanceBalance}
                    onChangeText={setAdvanceBalance}
                  />
                </View>
              </View>

              <View style={styles.actionRow}>
                {onDelete && (
                  <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                    <Trash2 size={18} color="#dc2626" />
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.submitBtn} onPress={handleSave} activeOpacity={0.8}>
                  <CheckCircle size={18} color="#ffffff" />
                  <Text style={styles.submitBtnText}>UPDATE CUSTOMER</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
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
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  deleteBtn: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
