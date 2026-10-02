import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { TransactionItem } from '../types';
import { Plus, Trash2, X, CheckCircle2 } from 'lucide-react-native';

interface ItemizedModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveItems: (items: TransactionItem[], totalAmount: number) => void;
  initialItems?: TransactionItem[];
}

export const ItemizedModal: React.FC<ItemizedModalProps> = ({
  visible,
  onClose,
  onSaveItems,
  initialItems = []
}) => {
  const [items, setItems] = useState<TransactionItem[]>(
    initialItems.length > 0 ? initialItems : [{ item_name: '', quantity: 1, rate: 0, amount: 0 }]
  );

  const handleItemChange = (index: number, field: keyof TransactionItem, value: any) => {
    const newItems = [...items];
    const current = { ...newItems[index], [field]: value };

    if (field === 'quantity' || field === 'rate') {
      const q = field === 'quantity' ? parseFloat(value) || 0 : current.quantity;
      const r = field === 'rate' ? parseFloat(value) || 0 : current.rate;
      current.amount = Math.round(q * r);
    }

    newItems[index] = current;
    setItems(newItems);
  };

  const addItemRow = () => {
    setItems([...items, { item_name: '', quantity: 1, rate: 0, amount: 0 }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const totalCalculated = items.reduce((acc, item) => acc + (item.amount || 0), 0);

  const handleSave = () => {
    const validItems = items.filter(i => i.item_name.trim().length > 0 && i.amount > 0);
    onSaveItems(validItems, totalCalculated);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Modal Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Itemized Bill Breakdown</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Items List */}
          <ScrollView style={styles.listContainer}>
            {items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <View style={styles.inputGroupFlex}>
                  <Text style={styles.inputLabel}>Item Name</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Atta 10kg, Milk"
                    value={item.item_name}
                    onChangeText={(val) => handleItemChange(idx, 'item_name', val)}
                  />
                </View>

                <View style={styles.numRow}>
                  <View style={styles.numInputGroup}>
                    <Text style={styles.inputLabel}>Qty</Text>
                    <TextInput
                      style={styles.numInput}
                      keyboardType="numeric"
                      value={item.quantity ? item.quantity.toString() : ''}
                      onChangeText={(val) => handleItemChange(idx, 'quantity', val)}
                    />
                  </View>

                  <View style={styles.numInputGroup}>
                    <Text style={styles.inputLabel}>Rate (₹)</Text>
                    <TextInput
                      style={styles.numInput}
                      keyboardType="numeric"
                      value={item.rate ? item.rate.toString() : ''}
                      onChangeText={(val) => handleItemChange(idx, 'rate', val)}
                    />
                  </View>

                  <View style={styles.numInputGroup}>
                    <Text style={styles.inputLabel}>Total</Text>
                    <Text style={styles.totalValText}>₹{item.amount}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => removeItemRow(idx)}
                  >
                    <Trash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.addBtn} onPress={addItemRow}>
              <Plus size={18} color="#2563eb" />
              <Text style={styles.addBtnText}>Add Another Item</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Footer Total & Save */}
          <View style={styles.footer}>
            <View>
              <Text style={styles.footerTotalLabel}>Calculated Total</Text>
              <Text style={styles.footerTotalVal}>₹{totalCalculated.toLocaleString('en-IN')}</Text>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <CheckCircle2 size={18} color="#ffffff" />
              <Text style={styles.saveBtnText}>Apply Bill Items</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 14,
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  closeBtn: {
    padding: 4,
  },
  listContainer: {
    maxHeight: 380,
  },
  itemRow: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputGroupFlex: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0f172a',
  },
  numRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  numInputGroup: {
    flex: 1,
  },
  numInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0f172a',
  },
  totalValText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16a34a',
    marginTop: 6,
  },
  deleteBtn: {
    padding: 8,
    marginTop: 14,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 8,
    gap: 8,
  },
  addBtnText: {
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 16,
    marginTop: 12,
  },
  footerTotalLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  footerTotalVal: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
