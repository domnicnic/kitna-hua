import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { ChevronLeft, ChevronRight, X, Calendar, Check } from 'lucide-react-native';

interface MobileMonthPickerModalProps {
  visible: boolean;
  selectedMonth: string; // Format: YYYY-MM
  onClose: () => void;
  onSelectMonth: (monthStr: string) => void;
}

export const MobileMonthPickerModal: React.FC<MobileMonthPickerModalProps> = ({
  visible,
  selectedMonth,
  onClose,
  onSelectMonth
}) => {
  const parseYear = () => {
    if (selectedMonth && selectedMonth.includes('-')) {
      return parseInt(selectedMonth.split('-')[0], 10) || new Date().getFullYear();
    }
    return new Date().getFullYear();
  };

  const [activeYear, setActiveYear] = useState<number>(parseYear());

  const months = [
    { num: '01', short: 'Jan', full: 'January' },
    { num: '02', short: 'Feb', full: 'February' },
    { num: '03', short: 'Mar', full: 'March' },
    { num: '04', short: 'Apr', full: 'April' },
    { num: '05', short: 'May', full: 'May' },
    { num: '06', short: 'Jun', full: 'June' },
    { num: '07', short: 'Jul', full: 'July' },
    { num: '08', short: 'Aug', full: 'August' },
    { num: '09', short: 'Sep', full: 'September' },
    { num: '10', short: 'Oct', full: 'October' },
    { num: '11', short: 'Nov', full: 'November' },
    { num: '12', short: 'Dec', full: 'December' },
  ];

  const handleMonthClick = (monthNum: string) => {
    const formatted = `${activeYear}-${monthNum}`;
    onSelectMonth(formatted);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.dismissOverlay} onPress={onClose} activeOpacity={1} />
        
        <View style={styles.sheetContainer}>
          {/* Top Handle Bar */}
          <View style={styles.handleBar} />

          {/* Sheet Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Calendar size={20} color="#38bdf8" />
              <Text style={styles.title}>Select Billing Period</Text>
            </View>
            <TouchableOpacity 
              onPress={onClose} 
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Year Selector Carousel */}
          <View style={styles.yearCarousel}>
            <TouchableOpacity 
              style={styles.yearBtn} 
              onPress={() => setActiveYear(prev => prev - 1)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ChevronLeft size={20} color="#38bdf8" />
            </TouchableOpacity>

            <Text style={styles.yearText}>{activeYear}</Text>

            <TouchableOpacity 
              style={styles.yearBtn} 
              onPress={() => setActiveYear(prev => prev + 1)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ChevronRight size={20} color="#38bdf8" />
            </TouchableOpacity>
          </View>

          {/* 12-Month Touch Grid (3x4) */}
          <View style={styles.grid}>
            {months.map(m => {
              const itemKey = `${activeYear}-${m.num}`;
              const isSelected = selectedMonth === itemKey;

              return (
                <TouchableOpacity
                  key={m.num}
                  style={[styles.monthCard, isSelected && styles.monthCardSelected]}
                  onPress={() => handleMonthClick(m.num)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.monthShort, isSelected && styles.monthShortSelected]}>
                    {m.short}
                  </Text>
                  <Text style={[styles.monthFull, isSelected && styles.monthFullSelected]}>
                    {m.full}
                  </Text>
                  {isSelected && (
                    <View style={styles.checkBadge}>
                      <Check size={14} color="#ffffff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  dismissOverlay: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#475569',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  closeBtn: {
    padding: 4,
  },
  yearCarousel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  yearBtn: {
    padding: 6,
  },
  yearText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  monthCard: {
    width: '31%',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    minHeight: 64,
    position: 'relative',
  },
  monthCardSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#38bdf8',
  },
  monthShort: {
    fontSize: 16,
    fontWeight: '800',
    color: '#cbd5e1',
  },
  monthShortSelected: {
    color: '#ffffff',
  },
  monthFull: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  monthFullSelected: {
    color: '#93c5fd',
  },
  checkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#16a34a',
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
