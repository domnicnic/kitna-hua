import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { TransactionItem, TransactionType } from '../types';
import { ItemizedModal } from './ItemizedModal';
import { ShoppingBag, ArrowUpRight, ArrowDownLeft, Wallet, Send } from 'lucide-react-native';

interface QuickCalculatorPadProps {
  onSaveTransaction: (
    type: TransactionType,
    amount: number,
    items?: TransactionItem[],
    notes?: string
  ) => void;
  customerName?: string;
}

export const QuickCalculatorPad: React.FC<QuickCalculatorPadProps> = ({
  onSaveTransaction,
  customerName
}) => {
  const [amountStr, setAmountStr] = useState<string>('0');
  const [selectedType, setSelectedType] = useState<TransactionType>('UDHAAR');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [isItemModalOpen, setIsItemModalOpen] = useState<boolean>(false);

  const handleKeyPress = (val: string) => {
    if (val === 'C') {
      setAmountStr('0');
      setItems([]);
      return;
    }
    if (val === 'DEL') {
      if (amountStr.length <= 1) setAmountStr('0');
      else setAmountStr(amountStr.slice(0, -1));
      return;
    }
    if (amountStr === '0') {
      setAmountStr(val);
    } else {
      setAmountStr(amountStr + val);
    }
  };

  const handleSaveItems = (newItems: TransactionItem[], totalAmount: number) => {
    setItems(newItems);
    setAmountStr(totalAmount.toString());
  };

  const handleSubmit = () => {
    const numericAmt = parseFloat(amountStr);
    if (!numericAmt || numericAmt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid bill amount greater than ₹0.');
      return;
    }

    onSaveTransaction(selectedType, numericAmt, items, notes);
    setAmountStr('0');
    setNotes('');
    setItems([]);
  };

  return (
    <View style={styles.container}>
      {/* Type Toggle Tabs */}
      <View style={styles.typeRow}>
        <TouchableOpacity
          style={[styles.typeBtn, selectedType === 'UDHAAR' && styles.typeBtnUdhaar]}
          onPress={() => setSelectedType('UDHAAR')}
        >
          <ArrowUpRight size={16} color={selectedType === 'UDHAAR' ? '#ffffff' : '#dc2626'} />
          <Text style={[styles.typeText, selectedType === 'UDHAAR' && styles.typeTextActive]}>
            GAVE (Udhaar)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeBtn, selectedType === 'JAMA' && styles.typeBtnJama]}
          onPress={() => setSelectedType('JAMA')}
        >
          <ArrowDownLeft size={16} color={selectedType === 'JAMA' ? '#ffffff' : '#16a34a'} />
          <Text style={[styles.typeText, selectedType === 'JAMA' && styles.typeTextActive]}>
            GOT (Jama)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeBtn, selectedType === 'ADVANCE_DEPOSIT' && styles.typeBtnAdvance]}
          onPress={() => setSelectedType('ADVANCE_DEPOSIT')}
        >
          <Wallet size={16} color={selectedType === 'ADVANCE_DEPOSIT' ? '#ffffff' : '#0284c7'} />
          <Text style={[styles.typeText, selectedType === 'ADVANCE_DEPOSIT' && styles.typeTextActive]}>
            ADVANCE (Wallet)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Display Box */}
      <View style={styles.displayCard}>
        <Text style={styles.displayLabel}>
          {customerName ? `Entry for ${customerName}` : 'Enter Bill Amount'}
        </Text>
        <View style={styles.amountDisplayRow}>
          <Text style={styles.currencySymbol}>₹</Text>
          <Text style={styles.amountText}>{amountStr}</Text>
        </View>

        {/* Itemized pill trigger */}
        <TouchableOpacity
          style={styles.itemizedPill}
          onPress={() => setIsItemModalOpen(true)}
        >
          <ShoppingBag size={14} color="#2563eb" />
          <Text style={styles.itemizedPillText}>
            {items.length > 0 ? `${items.length} Items Added (₹${amountStr})` : '+ Add Item Breakdown (Atta, Oil, Milk)'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notes Input */}
      <TextInput
        style={styles.notesInput}
        placeholder="Add Bill Notes / Description (Optional)"
        value={notes}
        onChangeText={setNotes}
      />

      {/* Calculator Keypad */}
      <View style={styles.keypad}>
        {['7', '8', '9', '4', '5', '6', '1', '2', '3', '00', '0', '.'].map((key) => (
          <TouchableOpacity
            key={key}
            style={styles.key}
            onPress={() => handleKeyPress(key)}
            activeOpacity={0.7}
          >
            <Text style={styles.keyNumText}>{key}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bottom Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={() => handleKeyPress('C')}
        >
          <Text style={styles.clearText}>CLEAR</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.submitBtn,
            selectedType === 'UDHAAR' ? styles.subUdhaar : selectedType === 'JAMA' ? styles.subJama : styles.subAdv
          ]}
          onPress={handleSubmit}
          activeOpacity={0.8}
        >
          <Send size={18} color="#ffffff" />
          <Text style={styles.submitBtnText}>SAVE TRANSACTION</Text>
        </TouchableOpacity>
      </View>

      {/* Itemized Modal */}
      <ItemizedModal
        visible={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSaveItems={handleSaveItems}
        initialItems={items}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    gap: 4,
  },
  typeBtnUdhaar: {
    backgroundColor: '#dc2626',
    borderColor: '#b91c1c',
  },
  typeBtnJama: {
    backgroundColor: '#16a34a',
    borderColor: '#15803d',
  },
  typeBtnAdvance: {
    backgroundColor: '#0284c7',
    borderColor: '#0369a1',
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  typeTextActive: {
    color: '#ffffff',
  },
  displayCard: {
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginBottom: 12,
  },
  displayLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  amountDisplayRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 4,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginRight: 4,
  },
  amountText: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0f172a',
  },
  itemizedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginTop: 4,
  },
  itemizedPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284c7',
  },
  notesInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
    marginBottom: 14,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
  },
  key: {
    width: '30%',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyNumText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  actionBar: {
    flexDirection: 'row',
    gap: 10,
  },
  clearBtn: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: {
    color: '#dc2626',
    fontWeight: '800',
    fontSize: 12,
  },
  submitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  subUdhaar: {
    backgroundColor: '#dc2626',
  },
  subJama: {
    backgroundColor: '#16a34a',
  },
  subAdv: {
    backgroundColor: '#0284c7',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
