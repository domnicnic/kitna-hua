import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, Alert, ScrollView, TextInput } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { RegisterStoreModal } from './RegisterStoreModal';
import { Fingerprint, Delete, ShieldCheck, ShieldAlert, Store, ChevronDown, Check, UserCheck, KeyRound, PlusCircle } from 'lucide-react-native';

type AuthMode = 'PHONE_LOGIN' | 'STORE_LOGIN' | 'SUPER_ADMIN' | 'REGISTER';

export const PinLockScreen: React.FC = () => {
  const {
    isLocked,
    allStores,
    activeStoreId,
    unlockAsStoreAdmin,
    unlockAsSuperAdmin,
    unlockWithBiometrics,
    loginWithPhoneAndPassword,
    registerStore,
    superAdminPin
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>('STORE_LOGIN');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [isStorePickerOpen, setIsStorePickerOpen] = useState<boolean>(false);

  // Phone + Password Auth State
  const [loginPhone, setLoginPhone] = useState<string>('');
  const [loginPass, setLoginPass] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  // Registration Form State
  const [regStoreName, setRegStoreName] = useState<string>('');
  const [regOwnerName, setRegOwnerName] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regAddress, setRegAddress] = useState<string>('');
  const [regPin, setRegPin] = useState<string>('');
  const [regError, setRegError] = useState<string>('');

  useEffect(() => {
    if (allStores.length > 0) {
      if (activeStoreId && allStores.some(s => s.id === activeStoreId)) {
        setSelectedStoreId(activeStoreId);
      } else {
        setSelectedStoreId(allStores[0].id);
      }
      setMode('STORE_LOGIN');
    } else {
      setMode('REGISTER');
    }
  }, [allStores, activeStoreId]);

  if (!isLocked) return null;

  const currentStore = allStores.find(s => s.id === selectedStoreId) || allStores[0];

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin.length === 4) {
        setTimeout(() => {
          verifyPinAndUnlock(nextPin);
        }, 100);
      }
    }
  };

  const verifyPinAndUnlock = (inputPin: string) => {
    if (mode === 'SUPER_ADMIN') {
      const result = unlockAsSuperAdmin(inputPin);
      if (!result.success) {
        Alert.alert('Super Admin Login Failed', result.error || 'Incorrect Super Admin PIN.');
        setPin('');
      }
    } else {
      if (!selectedStoreId) {
        Alert.alert('Store Required', 'Please select or register a store first.');
        setPin('');
        return;
      }

      const result = unlockAsStoreAdmin(selectedStoreId, inputPin);
      if (!result.success) {
        Alert.alert('Store Login Failed', result.error || 'Incorrect Store Security PIN.');
        setPin('');
      }
    }
  };

  const handlePhoneLoginSubmit = async () => {
    if (!loginPhone.trim() || !loginPass.trim()) {
      setLoginError('Please enter Phone Number and Password/PIN.');
      return;
    }

    setLoginError('');
    const res = await loginWithPhoneAndPassword(loginPhone, loginPass);
    if (!res.success) {
      setLoginError(res.error || 'Invalid Phone Number or Password.');
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleRegisterSubmit = async () => {
    if (!regStoreName.trim() || !regOwnerName.trim() || !regPhone.trim()) {
      setRegError('Please enter Store Name, Owner Name, and Phone Number.');
      return;
    }
    if (!regPin || regPin.length !== 4) {
      setRegError('Please specify a 4-digit Security PIN for your store.');
      return;
    }

    try {
      setRegError('');
      const created = await registerStore({
        store_name: regStoreName.trim(),
        owner_name: regOwnerName.trim(),
        phone: regPhone.trim(),
        address: regAddress.trim(),
        pin_hash: regPin.trim()
      });

      Alert.alert('Store Registered!', `Welcome to Kitna Hua, ${created.store_name}!`);
    } catch (e: any) {
      setRegError(e.message || 'Failed to register store.');
    }
  };

  return (
    <Modal visible={isLocked} animationType="fade" transparent={false}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header & Logo */}
          <View style={styles.header}>
            <Image
              source={require('../../assets/logo.jpg')}
              style={styles.logo}
              resizeMode="cover"
            />
            <Text style={styles.appName}>Kitna Hua</Text>
            <Text style={styles.subtitle}>Universal Digital Ledger & Billing System</Text>
          </View>

          {/* Mode Switcher Tabs */}
          <View style={styles.modeTabs}>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'PHONE_LOGIN' && styles.modeTabActive]}
              onPress={() => {
                setMode('PHONE_LOGIN');
                setLoginError('');
              }}
            >
              <KeyRound size={16} color={mode === 'PHONE_LOGIN' ? '#ffffff' : '#64748b'} />
              <Text style={[styles.modeTabText, mode === 'PHONE_LOGIN' && styles.modeTabTextActive]}>
                Phone Auth
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeTab, mode === 'STORE_LOGIN' && styles.modeTabActive]}
              onPress={() => {
                setMode('STORE_LOGIN');
                setPin('');
              }}
            >
              <Store size={16} color={mode === 'STORE_LOGIN' ? '#ffffff' : '#64748b'} />
              <Text style={[styles.modeTabText, mode === 'STORE_LOGIN' && styles.modeTabTextActive]}>
                Store PIN
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeTab, mode === 'SUPER_ADMIN' && styles.modeTabActiveSuper]}
              onPress={() => {
                setMode('SUPER_ADMIN');
                setPin('');
              }}
            >
              <ShieldAlert size={16} color={mode === 'SUPER_ADMIN' ? '#ffffff' : '#64748b'} />
              <Text style={[styles.modeTabText, mode === 'SUPER_ADMIN' && styles.modeTabTextActive]}>
                Admin
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeTab, mode === 'REGISTER' && styles.modeTabActiveGreen]}
              onPress={() => {
                setMode('REGISTER');
                setPin('');
              }}
            >
              <PlusCircle size={16} color={mode === 'REGISTER' ? '#ffffff' : '#64748b'} />
              <Text style={[styles.modeTabText, mode === 'REGISTER' && styles.modeTabTextActive]}>
                New Shop
              </Text>
            </TouchableOpacity>
          </View>

          {/* PHONE + PASSWORD AUTH MODE */}
          {mode === 'PHONE_LOGIN' && (
            <View style={styles.regCard}>
              <Text style={styles.regCardTitle}>Phone & Password Authentication</Text>
              <Text style={styles.regCardSub}>Log in using your registered mobile number & password.</Text>

              {loginError ? <Text style={styles.regErrorText}>{loginError}</Text> : null}

              <View style={styles.regInputGroup}>
                <Text style={styles.inputLabel}>Mobile Phone Number (10 Digits) *</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="phone-pad"
                  placeholder="e.g. 9876543210"
                  placeholderTextColor="#64748b"
                  value={loginPhone}
                  onChangeText={setLoginPhone}
                />
              </View>

              <View style={styles.regInputGroup}>
                <Text style={styles.inputLabel}>Password / Store PIN *</Text>
                <TextInput
                  style={styles.textInput}
                  secureTextEntry
                  placeholder="Enter Password / 4-Digit PIN"
                  placeholderTextColor="#64748b"
                  value={loginPass}
                  onChangeText={setLoginPass}
                />
              </View>

              <TouchableOpacity style={styles.submitRegBtn} onPress={handlePhoneLoginSubmit}>
                <UserCheck size={18} color="#ffffff" />
                <Text style={styles.submitRegBtnText}>LOG IN TO ACCOUNT</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STORE LOGIN MODE */}
          {mode === 'STORE_LOGIN' && (
            <View style={styles.cardContainer}>
              {allStores.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>No Shops Registered Yet</Text>
                  <Text style={styles.emptySub}>
                    Register your store account below to start managing customer accounts.
                  </Text>
                  <TouchableOpacity
                    style={styles.regDirectBtn}
                    onPress={() => setMode('REGISTER')}
                  >
                    <PlusCircle size={18} color="#ffffff" />
                    <Text style={styles.regDirectBtnText}>Register Store Account</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.fieldLabel}>Select Store Account:</Text>
                  <TouchableOpacity
                    style={styles.storeSelectorBtn}
                    onPress={() => setIsStorePickerOpen(!isStorePickerOpen)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.selectedStoreName}>
                        {currentStore ? currentStore.store_name : 'Select Store'}
                      </Text>
                      {currentStore ? (
                        <Text style={styles.selectedStoreSub}>
                          Proprietor: {currentStore.owner_name} | Tel: {currentStore.phone}
                        </Text>
                      ) : null}
                    </View>
                    <ChevronDown size={20} color="#38bdf8" />
                  </TouchableOpacity>

                  {/* Store Selector Dropdown */}
                  {isStorePickerOpen && (
                    <View style={styles.dropdownMenu}>
                      {allStores.map(s => {
                        const isSel = s.id === selectedStoreId;
                        return (
                          <TouchableOpacity
                            key={s.id}
                            style={[styles.dropdownItem, isSel && styles.dropdownItemSel]}
                            onPress={() => {
                              setSelectedStoreId(s.id);
                              setIsStorePickerOpen(false);
                            }}
                          >
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.dropdownItemName, isSel && styles.dropdownItemNameSel]}>
                                {s.store_name}
                              </Text>
                              <Text style={styles.dropdownItemSub}>
                                {s.owner_name} ({s.phone})
                              </Text>
                            </View>
                            {isSel && <Check size={18} color="#0284c7" />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  <Text style={styles.pinPromptTitle}>Enter Store 4-Digit Security PIN</Text>

                  {/* PIN Indicators */}
                  <View style={styles.pinRow}>
                    {[0, 1, 2, 3].map((idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.dot,
                          pin.length > idx && styles.dotFilled
                        ]}
                      />
                    ))}
                  </View>

                  {/* Keypad */}
                  <View style={styles.keypad}>
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                      <TouchableOpacity
                        key={num}
                        style={styles.keyBtn}
                        onPress={() => handleKeyPress(num)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.keyText}>{num}</Text>
                      </TouchableOpacity>
                    ))}

                    <TouchableOpacity
                      style={[styles.keyBtn, styles.actionKey]}
                      onPress={unlockWithBiometrics}
                      activeOpacity={0.7}
                    >
                      <Fingerprint size={28} color="#0284c7" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.keyBtn}
                      onPress={() => handleKeyPress('0')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.keyText}>0</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.keyBtn, styles.actionKey]}
                      onPress={handleDelete}
                      activeOpacity={0.7}
                    >
                      <Delete size={26} color="#e11d48" />
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          )}

          {/* SUPER ADMIN MODE */}
          {mode === 'SUPER_ADMIN' && (
            <View style={styles.cardContainer}>
              <View style={styles.adminHeaderBox}>
                <ShieldAlert size={28} color="#38bdf8" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.adminBoxTitle}>Super Admin Master Authentication</Text>
                  <Text style={styles.adminBoxSub}>Global tenant oversight & multi-store administration</Text>
                </View>
              </View>

              <Text style={styles.pinPromptTitle}>Enter Super Admin 4-Digit Security PIN</Text>

              <View style={styles.pinRow}>
                {[0, 1, 2, 3].map((idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.dot,
                      styles.dotSuper,
                      pin.length > idx && styles.dotFilledSuper
                    ]}
                  />
                ))}
              </View>

              <View style={styles.keypad}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[styles.keyBtn, styles.keyBtnSuper]}
                    onPress={() => handleKeyPress(num)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.keyText}>{num}</Text>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={[styles.keyBtn, styles.actionKey]}
                  onPress={unlockWithBiometrics}
                  activeOpacity={0.7}
                >
                  <Fingerprint size={28} color="#38bdf8" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.keyBtn, styles.keyBtnSuper]}
                  onPress={() => handleKeyPress('0')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.keyText}>0</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.keyBtn, styles.actionKey]}
                  onPress={handleDelete}
                  activeOpacity={0.7}
                >
                  <Delete size={26} color="#e11d48" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* REGISTER NEW STORE MODE */}
          {mode === 'REGISTER' && (
            <View style={styles.regCard}>
              <Text style={styles.regCardTitle}>Register New Store Account</Text>
              <Text style={styles.regCardSub}>Create your store ledger workspace with a secure PIN.</Text>

              {regError ? <Text style={styles.regErrorText}>{regError}</Text> : null}

              <View style={styles.regInputGroup}>
                <Text style={styles.inputLabel}>Store / Shop Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. City Supermarket"
                  placeholderTextColor="#64748b"
                  value={regStoreName}
                  onChangeText={setRegStoreName}
                />
              </View>

              <View style={styles.regInputGroup}>
                <Text style={styles.inputLabel}>Owner / Proprietor Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Rajesh Kumar"
                  placeholderTextColor="#64748b"
                  value={regOwnerName}
                  onChangeText={setRegOwnerName}
                />
              </View>

              <View style={styles.regInputGroup}>
                <Text style={styles.inputLabel}>Phone Number *</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="phone-pad"
                  placeholder="e.g. 9876543210"
                  placeholderTextColor="#64748b"
                  value={regPhone}
                  onChangeText={setRegPhone}
                />
              </View>

              <View style={styles.regInputGroup}>
                <Text style={styles.inputLabel}>Store Address (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Main Market, Delhi"
                  placeholderTextColor="#64748b"
                  value={regAddress}
                  onChangeText={setRegAddress}
                />
              </View>

              <View style={styles.regInputGroup}>
                <Text style={styles.inputLabel}>4-Digit Store Security PIN *</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  secureTextEntry
                  maxLength={4}
                  placeholder="Set 4-digit PIN (e.g. 1234)"
                  placeholderTextColor="#64748b"
                  value={regPin}
                  onChangeText={setRegPin}
                />
              </View>

              <TouchableOpacity style={styles.submitRegBtn} onPress={handleRegisterSubmit}>
                <UserCheck size={18} color="#ffffff" />
                <Text style={styles.submitRegBtnText}>CREATE & LAUNCH STORE</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.securityFooter}>
            <ShieldCheck size={16} color="#10b981" />
            <Text style={styles.securityText}>Offline-First Encrypted Multi-Tenant Ledger</Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 40,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: '#d97706',
    marginBottom: 10,
  },
  appName: {
    color: '#38bdf8',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 4,
    width: '100%',
    maxWidth: 340,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  modeTabActive: { backgroundColor: '#2563eb' },
  modeTabActiveSuper: { backgroundColor: '#0284c7' },
  modeTabActiveGreen: { backgroundColor: '#16a34a' },
  modeTabText: { fontSize: 11, fontWeight: '700', color: '#94a3b8' },
  modeTabTextActive: { color: '#ffffff' },
  cardContainer: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyTitle: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  emptySub: { color: '#94a3b8', fontSize: 12, textAlign: 'center', marginTop: 6, marginBottom: 16 },
  regDirectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  regDirectBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  fieldLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '600', alignSelf: 'flex-start', marginBottom: 6 },
  storeSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#0284c7',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    marginBottom: 16,
  },
  selectedStoreName: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  selectedStoreSub: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  dropdownMenu: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  dropdownItemSel: { backgroundColor: '#0f172a' },
  dropdownItemName: { color: '#cbd5e1', fontSize: 14, fontWeight: '600' },
  dropdownItemNameSel: { color: '#38bdf8', fontWeight: '700' },
  dropdownItemSub: { color: '#64748b', fontSize: 11, marginTop: 2 },
  pinPromptTitle: { color: '#cbd5e1', fontSize: 13, fontWeight: '600', marginBottom: 14 },
  pinRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#38bdf8',
    backgroundColor: 'transparent',
  },
  dotFilled: { backgroundColor: '#38bdf8' },
  dotSuper: { borderColor: '#38bdf8' },
  dotFilledSuper: { backgroundColor: '#38bdf8' },
  keypad: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  keyBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyBtnSuper: { borderColor: '#0284c7' },
  actionKey: { backgroundColor: '#0f172a' },
  keyText: { color: '#ffffff', fontSize: 26, fontWeight: '700' },
  adminHeaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#0284c7',
    width: '100%',
    marginBottom: 20,
  },
  adminBoxTitle: { color: '#38bdf8', fontSize: 14, fontWeight: '700' },
  adminBoxSub: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  regCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
  },
  regCardTitle: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  regCardSub: { color: '#94a3b8', fontSize: 12, marginTop: 4, marginBottom: 14 },
  regErrorText: { color: '#f87171', fontSize: 12, fontWeight: '600', marginBottom: 10 },
  regInputGroup: { marginBottom: 12 },
  inputLabel: { color: '#cbd5e1', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  textInput: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#ffffff',
  },
  submitRegBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 6,
    gap: 8,
  },
  submitRegBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 24,
  },
  securityText: { color: '#10b981', fontSize: 12, fontWeight: '600' },
});
