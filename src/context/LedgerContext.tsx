import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Customer, LedgerMetrics, MonthlyDispatchCustomer, Transaction, TransactionType } from '../types';
import { db } from '../database/db';
import { useAuth } from './AuthContext';

export type FilterCategory = 'ALL' | 'PENDING' | 'ADVANCE' | 'CLEAR';

interface LedgerContextType {
  selectedMonth: string; // YYYY-MM
  setSelectedMonth: (month: string) => void;
  customers: Customer[];
  allCustomersGlobal: Customer[];
  transactions: Transaction[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterCategory: FilterCategory;
  setFilterCategory: (category: FilterCategory) => void;
  metrics: LedgerMetrics;
  filteredCustomers: Customer[];
  monthlyDispatches: MonthlyDispatchCustomer[];
  refreshData: () => Promise<void>;
  addNewCustomer: (name: string, phone: string, address?: string, creditLimit?: number, initialAdvance?: number, storeId?: string) => Promise<Customer>;
  updateExistingCustomer: (customer: Customer) => Promise<void>;
  deleteCustomerAccount: (customerId: string) => Promise<void>;
  addNewTransaction: (
    customerId: string,
    type: TransactionType,
    amount: number,
    items?: any[],
    notes?: string,
    photoUri?: string
  ) => Promise<Transaction>;
  getCustomerDetails: (customerId: string) => {
    customer?: Customer;
    transactions: Transaction[];
    totalUdhaar: number;
    totalJama: number;
    advanceBalance: number;
    currentBalance: number;
  };
  isLoading: boolean;
}

const LedgerContext = createContext<LedgerContextType | undefined>(undefined);

export const LedgerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeStoreId } = useAuth();
  const currentMonthStr = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allCustomersGlobal, setAllCustomersGlobal] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      await db.initDatabase();
      const globalCusts = await db.getAllCustomersGlobal();
      setAllCustomersGlobal(globalCusts);

      if (activeStoreId) {
        const loadedCusts = await db.getCustomers(activeStoreId);
        const loadedTxs = await db.getTransactions(activeStoreId);
        setCustomers(loadedCusts);
        setTransactions(loadedTxs);
      } else {
        setCustomers([]);
        setTransactions([]);
      }
    } catch (e) {
      console.error('Error refreshing ledger data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [selectedMonth, activeStoreId]);

  const customersWithBalances = useMemo(() => {
    return customers.map(cust => {
      const custTxs = transactions.filter(t => t.customer_id === cust.id);
      
      let totalUdhaar = 0;
      let totalJama = 0;

      custTxs.forEach(t => {
        if (t.type === 'UDHAAR') totalUdhaar += t.total_amount;
        if (t.type === 'JAMA') totalJama += t.total_amount;
      });

      const currentBalance = totalUdhaar - totalJama - (cust.advance_balance || 0);

      return {
        ...cust,
        total_udhaar: totalUdhaar,
        total_jama: totalJama,
        current_balance: currentBalance
      };
    });
  }, [customers, transactions]);

  const metrics: LedgerMetrics = useMemo(() => {
    let totalUdhaarGiven = 0;
    let totalJamaReceived = 0;
    let totalAdvanceDeposits = 0;

    transactions.forEach(t => {
      if (t.type === 'UDHAAR') totalUdhaarGiven += t.total_amount;
      if (t.type === 'JAMA') totalJamaReceived += t.total_amount;
      if (t.type === 'ADVANCE_DEPOSIT') totalAdvanceDeposits += t.total_amount;
    });

    const netPendingBalance = customersWithBalances.reduce((acc, c) => acc + (c.current_balance && c.current_balance > 0 ? c.current_balance : 0), 0);

    return {
      totalUdhaarGiven,
      totalJamaReceived,
      totalAdvanceDeposits,
      netPendingBalance
    };
  }, [transactions, customersWithBalances]);

  const filteredCustomers = useMemo(() => {
    return customersWithBalances.filter(c => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery);

      if (!matchesSearch) return false;

      const bal = c.current_balance || 0;
      if (filterCategory === 'PENDING') return bal > 0;
      if (filterCategory === 'ADVANCE') return c.advance_balance > 0 || bal < 0;
      if (filterCategory === 'CLEAR') return bal === 0;

      return true;
    });
  }, [customersWithBalances, searchQuery, filterCategory]);

  const monthlyDispatches: MonthlyDispatchCustomer[] = useMemo(() => {
    return customersWithBalances.map(cust => {
      const monthTxs = transactions.filter(t => t.customer_id === cust.id && t.billing_month === selectedMonth);
      let monthlyUdhaar = 0;
      let monthlyJama = 0;
      monthTxs.forEach(t => {
        if (t.type === 'UDHAAR') monthlyUdhaar += t.total_amount;
        if (t.type === 'JAMA') monthlyJama += t.total_amount;
      });

      const priorTxs = transactions.filter(t => t.customer_id === cust.id && t.billing_month < selectedMonth);
      let openingBalance = 0;
      priorTxs.forEach(t => {
        if (t.type === 'UDHAAR') openingBalance += t.total_amount;
        if (t.type === 'JAMA') openingBalance -= t.total_amount;
      });

      const closingBalance = openingBalance + monthlyUdhaar - monthlyJama - (cust.advance_balance || 0);

      return {
        customer: cust,
        openingBalance,
        monthlyUdhaar,
        monthlyJama,
        closingBalance
      };
    });
  }, [customersWithBalances, transactions, selectedMonth]);

  const addNewCustomer = async (
    name: string,
    phone: string,
    address?: string,
    creditLimit?: number,
    initialAdvance?: number,
    storeId?: string
  ): Promise<Customer> => {
    const targetStoreId = storeId || activeStoreId;
    if (!targetStoreId) {
      throw new Error('No active store selected for adding customer.');
    }

    const newCust = await db.addCustomer({
      store_id: targetStoreId,
      name,
      phone,
      address: address || '',
      credit_limit: creditLimit || 0,
      advance_balance: initialAdvance || 0
    });
    await refreshData();
    return newCust;
  };

  const updateExistingCustomer = async (customer: Customer) => {
    await db.updateCustomer(customer);
    await refreshData();
  };

  const deleteCustomerAccount = async (customerId: string) => {
    await db.deleteCustomer(customerId);
    await refreshData();
  };

  const addNewTransaction = async (
    customerId: string,
    type: TransactionType,
    amount: number,
    items?: any[],
    notes?: string,
    photoUri?: string
  ): Promise<Transaction> => {
    if (!activeStoreId) {
      throw new Error('No active store selected for adding transaction.');
    }

    const newTx = await db.addTransaction({
      store_id: activeStoreId,
      customer_id: customerId,
      type,
      total_amount: amount,
      items: items || [],
      notes: notes || '',
      bill_image_url: photoUri || '',
      billing_month: selectedMonth
    });
    await refreshData();
    return newTx;
  };

  const getCustomerDetails = (customerId: string) => {
    const customer = customersWithBalances.find(c => c.id === customerId);
    const customerTxs = transactions.filter(t => t.customer_id === customerId);
    
    let totalUdhaar = 0;
    let totalJama = 0;
    customerTxs.forEach(t => {
      if (t.type === 'UDHAAR') totalUdhaar += t.total_amount;
      if (t.type === 'JAMA') totalJama += t.total_amount;
    });

    const advanceBalance = customer?.advance_balance || 0;
    const currentBalance = totalUdhaar - totalJama - advanceBalance;

    return {
      customer,
      transactions: customerTxs,
      totalUdhaar,
      totalJama,
      advanceBalance,
      currentBalance
    };
  };

  return (
    <LedgerContext.Provider
      value={{
        selectedMonth,
        setSelectedMonth,
        customers: customersWithBalances,
        allCustomersGlobal,
        transactions,
        searchQuery,
        setSearchQuery,
        filterCategory,
        setFilterCategory,
        metrics,
        filteredCustomers,
        monthlyDispatches,
        refreshData,
        addNewCustomer,
        updateExistingCustomer,
        deleteCustomerAccount,
        addNewTransaction,
        getCustomerDetails,
        isLoading
      }}
    >
      {children}
    </LedgerContext.Provider>
  );
};

export const useLedger = () => {
  const context = useContext(LedgerContext);
  if (!context) {
    throw new Error('useLedger must be used within a LedgerProvider');
  }
  return context;
};
