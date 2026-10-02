import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLedger } from '../context/LedgerContext';
import { ChevronDown, Lock, ShieldCheck } from 'lucide-react-native';

interface HeaderProps {
  onOpenMonthSelector?: () => void;
  onOpenSettings?: () => void;
  onOpenAdminPortal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMonthSelector, onOpenSettings, onOpenAdminPortal }) => {
  const { storeProfile, role, lockApp } = useAuth();
  const { selectedMonth, metrics } = useLedger();

  const formatMonthTitle = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <View style={styles.container}>
      {/* Top Banner Row */}
      <View style={styles.topRow}>
        <View style={styles.brandGroup}>
          <Image
            source={require('../../assets/logo.jpg')}
            style={styles.roundLogo}
            resizeMode="cover"
          />
          <View style={styles.storeTextContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.storeName} numberOfLines={1}>
                {storeProfile?.store_name || (role === 'SUPER_ADMIN' ? 'Super Admin Overview' : 'Kitna Hua Ledger')}
              </Text>
              {role === 'SUPER_ADMIN' && (
                <View style={styles.superBadge}>
                  <Text style={styles.superBadgeText}>SUPER ADMIN</Text>
                </View>
              )}
            </View>
            <Text style={styles.ownerSubtitle}>
              {storeProfile ? `Proprietor: ${storeProfile.owner_name}` : 'Global Multi-Tenant Control'}
            </Text>
          </View>
        </View>

        <View style={styles.topActions}>
          <TouchableOpacity 
            style={styles.monthPill}
            onPress={onOpenMonthSelector}
            activeOpacity={0.8}
          >
            <Text style={styles.monthPillText}>{formatMonthTitle(selectedMonth)}</Text>
            <ChevronDown size={14} color="#2563eb" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={lockApp}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Lock size={18} color="#475569" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Metrics Bar */}
      <View style={styles.metricsContainer}>
        <View style={[styles.metricCard, styles.udhaarCard]}>
          <Text style={styles.metricLabel}>Total Udhaar</Text>
          <Text style={[styles.metricValue, { color: '#dc2626' }]}>
            ₹{metrics.totalUdhaarGiven.toLocaleString('en-IN')}
          </Text>
        </View>

        <View style={[styles.metricCard, styles.jamaCard]}>
          <Text style={styles.metricLabel}>Total Jama</Text>
          <Text style={[styles.metricValue, { color: '#16a34a' }]}>
            ₹{metrics.totalJamaReceived.toLocaleString('en-IN')}
          </Text>
        </View>

        <View style={[styles.metricCard, styles.pendingCard]}>
          <Text style={styles.metricLabel}>Net Due</Text>
          <Text style={[styles.metricValue, { color: '#2563eb' }]}>
            ₹{metrics.netPendingBalance.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...Platform.select({
      web: { boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.15)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
      }
    })
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  roundLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#d97706',
    marginRight: 12,
  },
  storeTextContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  storeName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  superBadge: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  superBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  ownerSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  monthPillText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '600',
  },
  iconBtn: {
    backgroundColor: '#1e293b',
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  udhaarCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
  },
  jamaCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#22c55e',
  },
  pendingCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  metricLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
});
