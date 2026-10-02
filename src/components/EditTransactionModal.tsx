import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Transaction } from '../types';
import { FileText, Trash2, X, CheckCircle } from 'lucide-react-native';

interface EditTransactionModalProps {
  visible: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onUpdate: (txId: string, amount: number, notes: string) => Promise<void>;
  onDelete: (txId: string) => Promise<void>;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  visible,
  transaction,
  onClose,
  onUpdate,
  onDelete
}) => {
  const [amountStr, setAmountStr] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (transaction) {
      setAmountStr(transaction.total_amount.toString());
      setNotes(transaction.notes || '');
    }
  }, [transaction]);

  if (!transaction) return null;

  const handleSave = async () => {
    const numAmt = parseFloat(amountStr);
    if (!numAmt || numAmt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid positive amount.');
      return;
    }

    await onUpdate(transaction.id, numAmt, notes.trim());
    onClose();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Ledger Entry?',
      'Are you sure you want to delete this transaction entry? Running account balance will be recalculated.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Entry',
          style: 'destructive',
          onPress: async () => {
            await onDelete(transaction.id);
            onClose();
          }
        }
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Edit Transaction Entry</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoType}>Type: {transaction.type}</Text>
            <Text style={styles.infoDate}>
              Date: {new Date(transaction.created_at).toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Transaction Amount (₹)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={amountStr}
              onChangeText={setAmountStr}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Notes / Description</Text>
            <TextInput
              style={[styles.input, { height: 70 }]}
              multiline
              placeholder="Add audit note..."
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Trash2 size={18} color="#dc2626" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
              <CheckCircle size={18} color="#ffffff" />
              <Text style={styles.submitBtnText}>UPDATE ENTRY</Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  infoBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoType: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  infoDate: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  input: {
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
    marginTop: 6,
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
    fontSize: 14,
    fontWeight: '700',
  },
});
