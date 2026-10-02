import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../database/db';
import { StoreProfile, StoreRegisterParams, User, UserRole } from '../types';
import * as LocalAuthentication from 'expo-local-authentication';

const SUPER_ADMIN_PIN_KEY = 'kitnahua_v4_super_admin_pin';

interface AuthContextType {
  user: User | null;
  storeProfile: StoreProfile | null;
  role: UserRole;
  allStores: StoreProfile[];
  activeStoreId: string | null;
  setActiveStoreId: (storeId: string) => void;
  isLocked: boolean;
  isPinRequired: boolean;
  superAdminPin: string;
  updateSuperAdminPin: (newPin: string) => Promise<boolean>;
  unlockAsStoreAdmin: (storeId: string, pin: string) => { success: boolean; error?: string };
  unlockAsSuperAdmin: (pin: string) => { success: boolean; error?: string };
  unlockWithPin: (pin: string) => boolean;
  unlockWithBiometrics: () => Promise<boolean>;
  updateProfile: (profile: StoreProfile) => Promise<void>;
  addNewStore: (storeData: Omit<StoreProfile, 'id' | 'created_at'>) => Promise<StoreProfile>;
  registerStore: (params: StoreRegisterParams) => Promise<StoreProfile>;
  toggleStoreStatus: (storeId: string, isActive: boolean) => Promise<void>;
  lockApp: () => void;
  resetApplicationData: () => Promise<void>;
  loading: boolean;
  refreshStores: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('STORE_ADMIN');
  const [user, setUser] = useState<User | null>(null);
  const [allStores, setAllStores] = useState<StoreProfile[]>([]);
  const [activeStoreId, setActiveStoreIdState] = useState<string | null>(null);
  const [storeProfile, setStoreProfile] = useState<StoreProfile | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [superAdminPin, setSuperAdminPinState] = useState<string>('9999');

  useEffect(() => {
    loadStoresAndAuth();
  }, []);

  const loadStoresAndAuth = async () => {
    try {
      await db.initDatabase();
      const savedSuperPin = await AsyncStorage.getItem(SUPER_ADMIN_PIN_KEY);
      if (savedSuperPin) {
        setSuperAdminPinState(savedSuperPin);
      } else {
        await AsyncStorage.setItem(SUPER_ADMIN_PIN_KEY, '9999');
      }

      const stores = await db.getAllStores();
      setAllStores(stores);

      if (stores.length > 0) {
        const active = (activeStoreId && stores.find(s => s.id === activeStoreId)) || stores[0];
        setStoreProfile(active);
        setActiveStoreIdState(active.id);
      } else {
        setStoreProfile(null);
        setActiveStoreIdState(null);
      }
    } catch (e) {
      console.error('Error loading stores & auth:', e);
    } finally {
      setLoading(false);
    }
  };

  const refreshStores = async () => {
    await loadStoresAndAuth();
  };

  const setActiveStoreId = (storeId: string) => {
    setActiveStoreIdState(storeId);
    const found = allStores.find(s => s.id === storeId);
    if (found) {
      setStoreProfile(found);
    }
  };

  const updateSuperAdminPin = async (newPin: string): Promise<boolean> => {
    if (!newPin || newPin.length !== 4) return false;
    await AsyncStorage.setItem(SUPER_ADMIN_PIN_KEY, newPin);
    setSuperAdminPinState(newPin);
    return true;
  };

  const unlockAsSuperAdmin = (pin: string): { success: boolean; error?: string } => {
    if (pin === superAdminPin) {
      setRole('SUPER_ADMIN');
      setUser({
        id: 'super-admin-001',
        store_id: null,
        email_or_phone: 'superadmin@kitnahua.com',
        role: 'SUPER_ADMIN'
      });
      setIsLocked(false);
      return { success: true };
    }
    return { success: false, error: 'Invalid Super Admin Security PIN.' };
  };

  const unlockAsStoreAdmin = (storeId: string, pin: string): { success: boolean; error?: string } => {
    const targetStore = allStores.find(s => s.id === storeId);
    if (!targetStore) {
      return { success: false, error: 'Store not found. Please select a valid store.' };
    }

    if (targetStore.is_active === false) {
      return { success: false, error: 'This store account has been deactivated by Super Admin.' };
    }

    const validPin = targetStore.pin_hash || '1234';
    if (pin === validPin) {
      setRole('STORE_ADMIN');
      setActiveStoreIdState(targetStore.id);
      setStoreProfile(targetStore);
      setUser({
        id: `user-${targetStore.id}`,
        store_id: targetStore.id,
        email_or_phone: targetStore.phone,
        role: 'STORE_ADMIN',
        store_name: targetStore.store_name
      });
      setIsLocked(false);
      return { success: true };
    }

    return { success: false, error: 'Incorrect 4-digit Store PIN.' };
  };

  const unlockWithPin = (pin: string): boolean => {
    // 1. Check Super Admin PIN
    if (pin === superAdminPin) {
      const res = unlockAsSuperAdmin(pin);
      return res.success;
    }

    // 2. Check current active store PIN
    if (activeStoreId) {
      const res = unlockAsStoreAdmin(activeStoreId, pin);
      return res.success;
    }

    return false;
  };

  const unlockWithBiometrics = async (): Promise<boolean> => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (hasHardware && isEnrolled) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Unlock Kitna Hua Ledger',
          fallbackLabel: 'Use PIN'
        });
        if (result.success) {
          setIsLocked(false);
          return true;
        }
      }
    } catch (e) {
      console.warn('Biometric unlock error:', e);
    }
    return false;
  };

  const updateProfile = async (newProfile: StoreProfile) => {
    await db.updateStore(newProfile);
    await refreshStores();
  };

  const addNewStore = async (storeData: Omit<StoreProfile, 'id' | 'created_at'>): Promise<StoreProfile> => {
    const created = await db.addStore(storeData);
    await refreshStores();
    return created;
  };

  const registerStore = async (params: StoreRegisterParams): Promise<StoreProfile> => {
    const created = await db.registerStore(params);
    setActiveStoreIdState(created.id);
    setStoreProfile(created);
    setRole('STORE_ADMIN');
    setUser({
      id: `user-${created.id}`,
      store_id: created.id,
      email_or_phone: created.phone,
      role: 'STORE_ADMIN',
      store_name: created.store_name
    });
    setIsLocked(false);
    await refreshStores();
    return created;
  };

  const toggleStoreStatus = async (storeId: string, isActive: boolean) => {
    await db.toggleStoreStatus(storeId, isActive);
    await refreshStores();
  };

  const lockApp = () => {
    setIsLocked(true);
  };

  const resetApplicationData = async () => {
    await db.clearAllData();
    setAllStores([]);
    setStoreProfile(null);
    setActiveStoreIdState(null);
    setUser(null);
    setIsLocked(true);
    await refreshStores();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        storeProfile,
        role,
        allStores,
        activeStoreId,
        setActiveStoreId,
        isLocked,
        isPinRequired: !!storeProfile?.pin_hash && storeProfile?.is_pin_enabled !== false,
        superAdminPin,
        updateSuperAdminPin,
        unlockAsStoreAdmin,
        unlockAsSuperAdmin,
        unlockWithPin,
        unlockWithBiometrics,
        updateProfile,
        addNewStore,
        registerStore,
        toggleStoreStatus,
        lockApp,
        resetApplicationData,
        loading,
        refreshStores
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
