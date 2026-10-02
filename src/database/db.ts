import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Customer, StoreProfile, StoreRegisterParams, Transaction, TransactionItem, User } from '../types';

const STORAGE_KEYS = {
  STORES: 'kitnahua_v4_stores',
  CUSTOMERS: 'kitnahua_v4_customers',
  TRANSACTIONS: 'kitnahua_v4_transactions',
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
            CREATE TABLE IF NOT EXISTS transaction_items (
              id TEXT PRIMARY KEY,
              transaction_id TEXT NOT NULL,
              item_name TEXT NOT NULL,
              quantity REAL DEFAULT 1,
              rate REAL NOT NULL,
              amount REAL NOT NULL
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
      await AsyncStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      return;
    }

    if (!isInit) {
      await AsyncStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify([]));
      await AsyncStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify([]));
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
      await AsyncStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    }
  }

  public async clearAllData(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.STORES);
    await AsyncStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    await AsyncStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    await AsyncStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }

  // STORE SELF-REGISTRATION & ONBOARDING
  public async registerStore(params: StoreRegisterParams): Promise<StoreProfile> {
    const stores = await this.getAllStores();
    const newStore: StoreProfile = {
      id: `store-${generateUUID().slice(0, 8)}`,
      store_name: params.store_name,
      owner_name: params.owner_name,
      phone: params.phone,
      address: params.address || '',
      pin_hash: params.pin_hash || '1234',
      is_active: true,
      created_at: new Date().toISOString()
    };

    const updated = [...stores, newStore];
    await AsyncStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(updated));
    return newStore;
  }

  // STORES SUPER ADMIN API
  public async getAllStores(): Promise<StoreProfile[]> {
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
    const stores = await this.getAllStores();
    return stores.find(s => s.id === storeId) || stores[0] || null;
  }

  public async addStore(store: Omit<StoreProfile, 'id' | 'created_at'>): Promise<StoreProfile> {
    const stores = await this.getAllStores();
    const newStore: StoreProfile = {
      ...store,
      id: `store-${generateUUID().slice(0, 8)}`,
      pin_hash: store.pin_hash || '1234',
      is_active: store.is_active !== undefined ? store.is_active : true,
      created_at: new Date().toISOString()
    };
    const updated = [...stores, newStore];
    await AsyncStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(updated));
    return newStore;
  }

  public async updateStore(store: StoreProfile): Promise<void> {
    const stores = await this.getAllStores();
    const updated = stores.map(s => s.id === store.id ? { ...s, ...store } : s);
    await AsyncStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(updated));
  }

  public async deleteStore(storeId: string): Promise<void> {
    const stores = await this.getAllStores();
    const updatedStores = stores.filter(s => s.id !== storeId);
    await AsyncStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(updatedStores));

    const custs = await this.getAllCustomersGlobal();
    const updatedCusts = custs.filter(c => c.store_id !== storeId);
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(updatedCusts));
  }

  public async toggleStoreStatus(storeId: string, isActive: boolean): Promise<void> {
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
    const all = await this.getAllCustomersGlobal();
    return all.filter(c => c.store_id === storeId);
  }

  public async addCustomer(customer: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> {
    const all = await this.getAllCustomersGlobal();
    const newCustomer: Customer = {
      ...customer,
      id: `cust-${generateUUID().slice(0, 8)}`,
      advance_balance: customer.advance_balance || 0,
      created_at: new Date().toISOString()
    };

    const updated = [...all, newCustomer];
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(updated));
    return newCustomer;
  }

  public async updateCustomer(customer: Customer): Promise<void> {
    const all = await this.getAllCustomersGlobal();
    const updated = all.map(c => c.id === customer.id ? { ...c, ...customer } : c);
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(updated));
  }

  public async deleteCustomer(customerId: string): Promise<void> {
    const all = await this.getAllCustomersGlobal();
    const updated = all.filter(c => c.id !== customerId);
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(updated));
  }

  public async updateCustomerAdvance(customerId: string, newAdvanceBalance: number): Promise<void> {
    const all = await this.getAllCustomersGlobal();
    const updated = all.map(c => c.id === customerId ? { ...c, advance_balance: newAdvanceBalance } : c);
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(updated));
  }

  // TRANSACTIONS API
  public async getAllTransactionsGlobal(): Promise<Transaction[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  }

  public async getTransactions(storeId: string, billingMonth?: string, customerId?: string): Promise<Transaction[]> {
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
    const allTxs = await this.getAllTransactionsGlobal();
    const newTx: Transaction = {
      ...tx,
      id: `tx-${generateUUID().slice(0, 8)}`,
      created_at: new Date().toISOString()
    };

    if (tx.type === 'ADVANCE_DEPOSIT') {
      const customers = await this.getAllCustomersGlobal();
      const cust = customers.find(c => c.id === tx.customer_id);
      if (cust) {
        await this.updateCustomerAdvance(tx.customer_id, (cust.advance_balance || 0) + tx.total_amount);
      }
    }

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
