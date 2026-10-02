import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Customer } from '../types';
import { Phone, ArrowUpRight, ArrowDownLeft, Wallet, MessageCircle, ChevronRight } from 'lucide-react-native';

interface CustomerCardProps {
  customer: Customer;
  onPress: () => void;
  onWhatsAppPress: () => void;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  onPress,
  onWhatsAppPress,
}) => {
  const currentBalance = customer.current_balance || 0;
  const isPending = currentBalance > 0;
  const isAdvance = customer.advance_balance > 0 || currentBalance < 0;
  const isClear = currentBalance === 0 && customer.advance_balance === 0;

  // Initials for avatar
  const initials = customer.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.leftGroup}>
        {/* Avatar */}
        <View style={[styles.avatar, isPending ? styles.avatarPending : isAdvance ? styles.avatarAdvance : styles.avatarClear]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        {/* Customer Info */}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{customer.name}</Text>
            {isAdvance && (
              <View style={styles.advanceBadge}>
                <Wallet size={10} color="#0284c7" />
                <Text style={styles.advanceBadgeText}>Adv: ₹{customer.advance_balance}</Text>
              </View>
            )}
          </View>
          <View style={styles.phoneRow}>
            <Phone size={12} color="#64748b" />
            <Text style={styles.phone}>{customer.phone}</Text>
          </View>
        </View>
      </View>

      {/* Balance & Actions */}
      <View style={styles.rightGroup}>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>
            {isPending ? 'Pending Due' : isAdvance ? 'In Advance' : 'Balance Clear'}
          </Text>
          <Text
            style={[
              styles.balanceValue,
              isPending ? styles.valPending : isAdvance ? styles.valAdvance : styles.valClear
            ]}
          >
            ₹{Math.abs(currentBalance).toLocaleString('en-IN')}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.whatsappBtn}
          onPress={onWhatsAppPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MessageCircle size={20} color="#16a34a" />
        </TouchableOpacity>

        <ChevronRight size={18} color="#94a3b8" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarPending: {
    backgroundColor: '#fee2e2',
  },
  avatarAdvance: {
    backgroundColor: '#e0f2fe',
  },
  avatarClear: {
    backgroundColor: '#dcfce7',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  advanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  advanceBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0284c7',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  phone: {
    fontSize: 12,
    color: '#64748b',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  balanceLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  valPending: {
    color: '#dc2626',
  },
  valAdvance: {
    color: '#0284c7',
  },
  valClear: {
    color: '#16a34a',
  },
  whatsappBtn: {
    backgroundColor: '#f0fdf4',
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
});
