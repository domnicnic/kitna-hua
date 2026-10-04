import React, { useState } from 'react';
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
import { StoreRegisterParams } from '../types';
import { Store, User, Phone, MapPin, Lock, X, CheckCircle } from 'lucide-react-native';

interface RegisterStoreModalProps {
  visible: boolean;
  onClose: () => void;
  onRegister: (params: StoreRegisterParams) => Promise<void>;
}

export const RegisterStoreModal: React.FC<RegisterStoreModalProps> = ({
  visible,
  onClose,
  onRegister
}) => {
  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [pinHash, setPinHash] = useState('1234');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');

    if (!storeName.trim() || !ownerName.trim()) {
      Alert.alert('Required Fields', 'Please enter your Store Name and Owner Name.');
      return;
    }
    if (!cleanPhone || cleanPhone.length !== 10) {
      Alert.alert('Valid Mobile Required', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!pinHash.trim() || pinHash.trim().length < 4) {
      Alert.alert('4-Digit PIN Required', 'Please choose a 4-digit security PIN.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onRegister({
        store_name: storeName.trim(),
        owner_name: ownerName.trim(),
        phone: cleanPhone,
        address: address.trim(),
        pin_hash: pinHash.trim()
      });

      setStoreName('');
      setOwnerName('');
      setPhone('');
      setAddress('');
      setPinHash('1234');
      onClose();
    } catch (e) {
      Alert.alert('Registration Error', 'Could not complete store registration.');
    } finally {
      setIsSubmitting(false);
    }
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
                <View>
                  <Text style={styles.title}>Shopkeeper Self-Registration</Text>
                  <Text style={styles.subtitle}>Create your free digital Khata workspace</Text>
                </View>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Store / Shop Name *</Text>
                <View style={styles.inputBox}>
                  <Store size={18} color="#64748b" />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Mahavir Kirana Store"
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
                    placeholder="e.g. Rajesh Sharma"
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
                    placeholder="e.g. 9876543210"
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
                    placeholder="e.g. Main Market, Delhi"
                    value={address}
                    onChangeText={setAddress}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Create 4-Digit Security PIN *</Text>
                <View style={styles.inputBox}>
                  <Lock size={18} color="#64748b" />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 1234"
                    keyboardType="numeric"
                    secureTextEntry
                    maxLength={4}
                    value={pinHash}
                    onChangeText={setPinHash}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                <CheckCircle size={18} color="#ffffff" />
                <Text style={styles.submitBtnText}>
                  {isSubmitting ? 'CREATING STORE...' : 'REGISTER & START BILLING'}
                </Text>
              </TouchableOpacity>
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
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
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
  submitBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
