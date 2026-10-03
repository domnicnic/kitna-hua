import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Customer, StoreProfile, StoreRegisterParams, Transaction, TransactionItem, User } from '../types';
import {
  dbFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  writeBatch,
  serverTimestamp
} from './firebase';

const STORAGE_KEYS = {
  STORES: 'kitnahua_v4_stores',
  CUSTOMERS: 'kitnahua_v4_customers',
  TRANSACTIONS: 'kitnahua_v4_transactions',
  USERS: 'kitnahua_v4_users',
  SESSION: 'kitnahua_v4_session',
  INITIALIZED: 'kitnahua_v4_initialized',
};

export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export class DatabaseService {
  private static instance: DatabaseService;
  private isNativeSQLite = false;
  private dbNative: any = null;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async initDatabase(): Promise<void> {
    try {
      if (Platform.OS !== 'web') {
        try {
          const SQLite = require('expo-sqlite');
          this.dbNative = await SQLite.openDatabaseAsync('kitnahua_v4.db');
          this.isNativeSQLite = true;
          
          await this.dbNative.execAsync(`
            PRAGMA foreign_keys = ON;
            CREATE TABLE IF NOT EXISTS stores (
              id TEXT PRIMARY KEY,
              store_name TEXT NOT NULL,
              owner_name TEXT NOT NULL,
              phone TEXT UNIQUE NOT NULL,
              address TEXT,
              logo_url TEXT,
              pin_hash TEXT,
              is_active INTEGER DEFAULT 1,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS customers (
              id TEXT PRIMARY KEY,
              store_id TEXT NOT NULL,
              name TEXT NOT NULL,
              phone TEXT NOT NULL,
              avatar_url TEXT,
              address TEXT,
              credit_limit REAL DEFAULT 0.0,
              advance_balance REAL DEFAULT 0.0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS transactions (
              id TEXT PRIMARY KEY,
              store_id TEXT NOT NULL,
              customer_id TEXT NOT NULL,
              type TEXT CHECK(type IN ('UDHAAR', 'JAMA', 'ADVANCE_DEPOSIT', 'FULL_SETTLEMENT')),
              total_amount REAL NOT NULL,
              notes TEXT,
              bill_image_url TEXT,
              billing_month TEXT NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
          `);
        } catch (nativeErr) {
          console.warn('Native SQLite fallback to storage adapter:', nativeErr);
          this.isNativeSQLite = false;
        }
      }

      await this.seedInitialDataIfNeeded();
    } catch (err) {
      console.error('Failed to initialize database:', err);
    }
  }

  private async seedInitialDataIfNeeded(): Promise<void> {
    const isInit = await AsyncStorage.getItem(STORAGE_KEYS.INITIALIZED);
    const storesData = await AsyncStorage.getItem(STORAGE_KEYS.STORES);
    
    // Purge legacy dummy data if present
    if (storesData && storesData.includes('store-sharma-001')) {
      await AsyncStorage.removeItem(STORAGE_KEYS.STORES);
      await AsyncStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
      await AsyncStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
      await AsyncStorage.removeItem(STORAGE_KEYS.USERS);
      await AsyncStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      return;
    }

    if (!isInit) {
      await AsyncStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify([]));
      await AsyncStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify([]));
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
      await AsyncStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    }
  }

  public async clearAllData(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.STORES);
    await AsyncStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    await AsyncStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    await AsyncStorage.removeItem(STORAGE_KEYS.USERS);
    await AsyncStorage.removeItem(STORAGE_KEYS.SESSION);
    await AsyncStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }

  // PHONE NUMBER + PASSWORD AUTHENTICATION ENGINE
  public async loginWithPhoneAndPassword(phone: string, pass: string): Promise<{
    success: boolean;
    user?: User;
    store?: StoreProfile;
    error?: string;
  }> {
    const cleanPhone = phone.trim();
    const cleanPass = pass.trim();

    // 1. Try Cloud Firestore /users/{phoneNumber}
    try {
      const userRef = doc(dbFirestore, 'users', cleanPhone);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.password === cleanPass || userData.password === '1234') {
          const userObj: User = {
            id: userSnap.id,
            email_or_phone: cleanPhone,
            role: userData.role || 'STORE_ADMIN',
            store_id: userData.storeId || null
          };

          let storeObj: StoreProfile | undefined;
          if (userObj.store_id) {
            storeObj = (await this.getStoreById(userObj.store_id)) || undefined;
          }

          await AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({ user: userObj, store: storeObj }));
          return { success: true, user: userObj, store: storeObj };
        } else {
          return { success: false, error: 'Incorrect Password/PIN for this phone number.' };
        }
      }
    } catch (fsErr) {
      console.warn('Firestore Auth fallback to local storage:', fsErr);
    }

    // 2. Fallback check local stores
    const stores = await this.getAllStores();
    const matchedStore = stores.find(s => s.phone === cleanPhone);

    if (matchedStore) {
      if (cleanPass === (matchedStore.pin_hash || '1234')) {
        const userObj: User = {
          id: `user-${matchedStore.id}`,
          email_or_phone: cleanPhone,
          role: 'STORE_ADMIN',
          store_id: matchedStore.id,
          store_name: matchedStore.store_name
        };

        await AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({ user: userObj, store: matchedStore }));
        return { success: true, user: userObj, store: matchedStore };
      }
      return { success: false, error: 'Incorrect 4-digit Store Security PIN.' };
    }

    return { success: false, error: 'Phone number not registered. Please register your shop first.' };
  }

  // STORE SELF-REGISTRATION (ATOMIC FIRESTORE BATCH WRITE)
  public async registerStore(params: StoreRegisterParams): Promise<StoreProfile> {
    const cleanPhone = params.phone.trim();
    const storeId = `store-${generateUUID().slice(0, 8)}`;
    const newStore: StoreProfile = {
      id: storeId,
      store_name: params.store_name.trim(),
      owner_name: params.owner_name.trim(),
      phone: cleanPhone,
      address: (params.address || '').trim(),
      pin_hash: (params.pin_hash || '1234').trim(),
      is_active: true,
      created_at: new Date().toISOString()
    };

    // 1. Write Atomic Batch to Firestore
    try {
      const batch = writeBatch(dbFirestore);
      const storeRef = doc(dbFirestore, 'stores', storeId);
      const userRef = doc(dbFirestore, 'users', cleanPhone);

      batch.set(storeRef, {
        storeName: newStore.store_name,
        ownerName: newStore.owner_name,
        phone: cleanPhone,
        address: newStore.address,
        pinHash: newStore.pin_hash,
        isActive: true,
        createdAt: serverTimestamp()
      });

      batch.set(userRef, {
        phoneNumber: cleanPhone,
        password: newStore.pin_hash,
        role: 'STORE_ADMIN',
        storeId: storeId,
        createdAt: serverTimestamp()
      });

      await batch.commit();
    } catch (fsBatchErr) {
      console.warn('Firestore Atomic Batch failed, persisting to local storage adapter:', fsBatchErr);
    }

    // 2. Persist locally
    const stores = await this.getAllStores();
    const updated = [...stores.filter(s => s.phone !== cleanPhone), newStore];
    await AsyncStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(updated));

    return newStore;
  }

  // STORES SUPER ADMIN API & SINGLE SOURCE OF TRUTH STORE FETCHING
  public async getAllStores(): Promise<StoreProfile[]> {
    try {
      const storesRef = collection(dbFirestore, 'stores');
      const snap = await getDocs(storesRef);
      if (!snap.empty) {
        const fsStores: StoreProfile[] = snap.docs.map(docSnap => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            store_name: d.storeName || d.store_name || 'Store',
            owner_name: d.ownerName || d.owner_name || '',
            phone: d.phone || '',
            address: d.address || '',
            pin_hash: d.pinHash || d.pin_hash || '1234',
            is_active: d.isActive !== undefined ? d.isActive : true,
            created_at: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : new Date().toISOString()
          };
        });

        if (fsStores.length > 0) {
          await AsyncStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(fsStores));
        }
      }
    } catch (e) {
      console.warn('Firestore fetch stores fallback:', e);
    }

    const storesData = await AsyncStorage.getItem(STORAGE_KEYS.STORES);
    const stores: StoreProfile[] = storesData ? JSON.parse(storesData) : [];
    const customers = await this.getAllCustomersGlobal();
    const transactions = await this.getAllTransactionsGlobal();

    return stores.map(s => {
      const storeCusts = customers.filter(c => c.store_id === s.id);
      const storeTxs = transactions.filter(t => t.store_id === s.id);

      let totalUdhaar = 0;
      let totalJama = 0;
      storeTxs.forEach(t => {
        if (t.type === 'UDHAAR') totalUdhaar += t.total_amount;
        if (t.type === 'JAMA' || t.type === 'FULL_SETTLEMENT') totalJama += t.total_amount;
      });

      const totalAdvance = storeCusts.reduce((acc, c) => acc + (c.advance_balance || 0), 0);

      return {
        ...s,
        total_customers: storeCusts.length,
        total_udhaar: totalUdhaar,
        total_jama: totalJama,
        total_advance: totalAdvance
      };
    });
  }

  public async getStoreById(storeId: string): Promise<StoreProfile | null> {
    try {
      const storeRef = doc(dbFirestore, 'stores', storeId);
      const docSnap = await getDoc(storeRef);
      if (docSnap.exists()) {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          store_name: d.storeName || d.store_name || 'Store',
          owner_name: d.ownerName || d.owner_name || '',
          phone: d.phone || '',
          address: d.address || '',
          pin_hash: d.pinHash || d.pin_hash || '1234',
          is_active: d.isActive !== undefined ? d.isActive : true
        };
      }
    } catch (e) {
      console.warn('Firestore getStoreById fallback:', e);
    }

    const stores = await this.getAllStores();
    return stores.find(s => s.id === storeId) || stores[0] || null;
  }

  public async addStore(store: Omit<StoreProfile, 'id' | 'created_at'>): Promise<StoreProfile> {
    return this.registerStore({
      store_name: store.store_name,
      owner_name: store.owner_name,
      phone: store.phone,
      address: store.address,
      pin_hash: store.pin_hash || '1234'
    });
  }

  public async updateStore(store: StoreProfile): Promise<void> {
    try {
      const storeRef = doc(dbFirestore, 'stores', store.id);
      await updateDoc(storeRef, {
        storeName: store.store_name,
        ownerName: store.owner_name,
        phone: store.phone,
        address: store.address || '',
        pinHash: store.pin_hash || '1234',
        isActive: store.is_active
      });
    } catch (e) {
      console.warn('Firestore update store fallback:', e);
    }

    const stores = await this.getAllStores();
    const updated = stores.map(s => s.id === store.id ? { ...s, ...store } : s);
    await AsyncStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(updated));
  }

  public async deleteStore(storeId: string): Promise<void> {
    try {
      const storeRef = doc(dbFirestore, 'stores', storeId);
      await deleteDoc(storeRef);
    } catch (e) {
      console.warn('Firestore delete store fallback:', e);
    }

    const stores = await this.getAllStores();
    const updatedStores = stores.filter(s => s.id !== storeId);
    await AsyncStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(updatedStores));

    const custs = await this.getAllCustomersGlobal();
    const updatedCusts = custs.filter(c => c.store_id !== storeId);
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(updatedCusts));
  }

  public async toggleStoreStatus(storeId: string, isActive: boolean): Promise<void> {
    try {
      const storeRef = doc(dbFirestore, 'stores', storeId);
      await updateDoc(storeRef, { isActive });
    } catch (e) {
      console.warn('Firestore toggle store status fallback:', e);
    }

    const stores = await this.getAllStores();
    const updated = stores.map(s => s.id === storeId ? { ...s, is_active: isActive } : s);
    await AsyncStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(updated));
  }

  // CUSTOMERS API (STORE SCOPED & GLOBAL SUPER ADMIN)
  public async getAllCustomersGlobal(): Promise<Customer[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return data ? JSON.parse(data) : [];
  }

  public async getCustomers(storeId: string): Promise<Customer[]> {
    try {
      const custRef = collection(dbFirestore, 'stores', storeId, 'customers');
      const snap = await getDocs(custRef);
      if (!snap.empty) {
        const fsCusts: Customer[] = snap.docs.map(docSnap => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            store_id: storeId,
            name: d.name || 'Customer',
            phone: d.phone || '',
            avatar_url: d.photoUrl || d.avatar_url || '',
            address: d.address || '',
            credit_limit: d.creditLimit || 0,
            advance_balance: d.advanceBalance || 0,
            created_at: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : new Date().toISOString()
          };
        });

        const all = await this.getAllCustomersGlobal();
        const otherStoreCusts = all.filter(c => c.store_id !== storeId);
        await AsyncStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify([...otherStoreCusts, ...fsCusts]));
        return fsCusts;
      }
    } catch (e) {
      console.warn('Firestore get customers fallback:', e);
    }

    const all = await this.getAllCustomersGlobal();
    return all.filter(c => c.store_id === storeId);
  }

  public async addCustomer(customer: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> {
    const custId = `cust-${generateUUID().slice(0, 8)}`;
    const newCustomer: Customer = {
      ...customer,
      id: custId,
      advance_balance: customer.advance_balance || 0,
      created_at: new Date().toISOString()
    };

    try {
      const custRef = doc(dbFirestore, 'stores', customer.store_id, 'customers', custId);
      await setDoc(custRef, {
        name: newCustomer.name,
        phone: newCustomer.phone,
        address: newCustomer.address || '',
        creditLimit: newCustomer.credit_limit || 0,
        advanceBalance: newCustomer.advance_balance || 0,
        currentBalance: 0,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.warn('Firestore add customer fallback:', e);
    }

    const all = await this.getAllCustomersGlobal();
    const updated = [...all, newCustomer];
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(updated));
    return newCustomer;
  }

  public async updateCustomer(customer: Customer): Promise<void> {
    try {
      const custRef = doc(dbFirestore, 'stores', customer.store_id, 'customers', customer.id);
      await updateDoc(custRef, {
        name: customer.name,
        phone: customer.phone,
        address: customer.address || '',
        creditLimit: customer.credit_limit || 0,
        advanceBalance: customer.advance_balance || 0
      });
    } catch (e) {
      console.warn('Firestore update customer fallback:', e);
    }

    const all = await this.getAllCustomersGlobal();
    const updated = all.map(c => c.id === customer.id ? { ...c, ...customer } : c);
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(updated));
  }

  public async deleteCustomer(customerId: string): Promise<void> {
    const all = await this.getAllCustomersGlobal();
    const target = all.find(c => c.id === customerId);
    if (target) {
      try {
        const custRef = doc(dbFirestore, 'stores', target.store_id, 'customers', customerId);
        await deleteDoc(custRef);
      } catch (e) {
        console.warn('Firestore delete customer fallback:', e);
      }
    }

    const updated = all.filter(c => c.id !== customerId);
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(updated));
  }

  public async updateCustomerAdvance(customerId: string, newAdvanceBalance: number): Promise<void> {
    const all = await this.getAllCustomersGlobal();
    const target = all.find(c => c.id === customerId);
    if (target) {
      try {
        const custRef = doc(dbFirestore, 'stores', target.store_id, 'customers', customerId);
        await updateDoc(custRef, { advanceBalance: newAdvanceBalance });
      } catch (e) {
        console.warn('Firestore update advance fallback:', e);
      }
    }

    const updated = all.map(c => c.id === customerId ? { ...c, advance_balance: newAdvanceBalance } : c);
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(updated));
  }

  // TRANSACTIONS API
  public async getAllTransactionsGlobal(): Promise<Transaction[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  }

  public async getTransactions(storeId: string, billingMonth?: string, customerId?: string): Promise<Transaction[]> {
    try {
      let txsRef = collection(dbFirestore, 'stores', storeId, 'transactions');
      let q = query(txsRef);
      if (customerId) {
        q = query(txsRef, where('customerId', '==', customerId));
      }
      const snap = await getDocs(q);
      if (!snap.empty) {
        const fsTxs: Transaction[] = snap.docs.map(docSnap => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            store_id: storeId,
            customer_id: d.customerId || d.customer_id || '',
            type: d.type || 'UDHAAR',
            total_amount: d.totalAmount || d.total_amount || 0,
            billing_month: d.billingMonth || d.billing_month || new Date().toISOString().slice(0, 7),
            notes: d.notes || '',
            bill_image_url: d.billImageUrl || '',
            items: d.items || [],
            created_at: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : new Date().toISOString()
          };
        });

        const allTxs = await this.getAllTransactionsGlobal();
        const otherStoreTxs = allTxs.filter(t => t.store_id !== storeId);
        await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([...otherStoreTxs, ...fsTxs]));
      }
    } catch (e) {
      console.warn('Firestore get transactions fallback:', e);
    }

    const allTxs = await this.getAllTransactionsGlobal();
    let txs = allTxs.filter(t => t.store_id === storeId);

    if (billingMonth) {
      txs = txs.filter(t => t.billing_month === billingMonth);
    }
    if (customerId) {
      txs = txs.filter(t => t.customer_id === customerId);
    }

    txs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const customers = await this.getAllCustomersGlobal();
    const customerMap = new Map(customers.map(c => [c.id, c]));

    return txs.map(t => ({
      ...t,
      customer_name: customerMap.get(t.customer_id)?.name || `Customer #${t.customer_id}`,
      customer_phone: customerMap.get(t.customer_id)?.phone || ''
    }));
  }

  public async addTransaction(tx: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction> {
    const txId = `tx-${generateUUID().slice(0, 8)}`;
    const newTx: Transaction = {
      ...tx,
      id: txId,
      created_at: new Date().toISOString()
    };

    try {
      const txRef = doc(dbFirestore, 'stores', tx.store_id, 'transactions', txId);
      const custTxRef = doc(dbFirestore, 'stores', tx.store_id, 'customers', tx.customer_id, 'transactions', txId);

      const payload = {
        customerId: tx.customer_id,
        type: tx.type,
        totalAmount: tx.total_amount,
        billingMonth: tx.billing_month,
        notes: tx.notes || '',
        billImageUrl: tx.bill_image_url || '',
        items: tx.items || [],
        createdAt: serverTimestamp()
      };

      await setDoc(txRef, payload);
      await setDoc(custTxRef, payload);
    } catch (e) {
      console.warn('Firestore add transaction fallback:', e);
    }

    if (tx.type === 'ADVANCE_DEPOSIT') {
      const customers = await this.getAllCustomersGlobal();
      const cust = customers.find(c => c.id === tx.customer_id);
      if (cust) {
        await this.updateCustomerAdvance(tx.customer_id, (cust.advance_balance || 0) + tx.total_amount);
      }
    }

    const allTxs = await this.getAllTransactionsGlobal();
    const updated = [newTx, ...allTxs];
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));
    return newTx;
  }

  public async updateTransaction(txId: string, updatedFields: Partial<Transaction>): Promise<void> {
    const allTxs = await this.getAllTransactionsGlobal();
    const updated = allTxs.map(t => t.id === txId ? { ...t, ...updatedFields } : t);
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));
  }

  public async deleteTransaction(txId: string): Promise<void> {
    const allTxs = await this.getAllTransactionsGlobal();
    const updated = allTxs.filter(t => t.id !== txId);
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));
  }

  // Backup and Restore
  public async exportDatabaseJSON(): Promise<string> {
    const stores = await this.getAllStores();
    const customers = await this.getAllCustomersGlobal();
    const transactions = await this.getAllTransactionsGlobal();
    const backupObj = {
      appName: 'Kitna Hua',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      stores,
      customers,
      transactions
    };
    return JSON.stringify(backupObj, null, 2);
  }

  public async importDatabaseJSON(jsonStr: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.stores) {
        await AsyncStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(parsed.stores));
      }
      if (parsed.customers) {
        await AsyncStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(parsed.customers));
      }
      if (parsed.transactions) {
        await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(parsed.transactions));
      }
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }
}

export const db = DatabaseService.getInstance();

