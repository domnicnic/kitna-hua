export type TransactionType = 'UDHAAR' | 'JAMA' | 'ADVANCE_DEPOSIT' | 'FULL_SETTLEMENT';
export type UserRole = 'SUPER_ADMIN' | 'STORE_ADMIN';

export interface StoreProfile {
  id: string; // UUID string
  store_name: string;
  owner_name: string;
  phone: string;
  address?: string;
  logo_url?: string;
  pin_hash?: string;
  is_pin_enabled?: boolean;
  is_active: boolean;
  created_at?: string;
  // Computed fields
  total_customers?: number;
  total_udhaar?: number;
  total_jama?: number;
  total_advance?: number;
}

export interface StoreRegisterParams {
  store_name: string;
  owner_name: string;
  phone: string;
  address?: string;
  pin_hash: string;
}

export interface User {
  id: string;
  store_id?: string | null; // Null if Super Admin
  email_or_phone: string;
  role: UserRole;
  store_name?: string;
}

export interface Customer {
  id: string; // UUID string
  store_id: string; // Tenant store scoping
  name: string;
  phone: string;
  avatar_url?: string;
  address?: string;
  credit_limit?: number;
  advance_balance: number;
  created_at: string;
  // Computed fields
  total_udhaar?: number;
  total_jama?: number;
  current_balance?: number;
}

export interface TransactionItem {
  id?: string;
  transaction_id?: string;
  item_name: string;
  quantity: number;
  rate: number;
  amount: number;
  unit?: string;
}

export interface Transaction {
  id: string;
  store_id: string;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  type: TransactionType;
  total_amount: number;
  notes?: string;
  bill_image_url?: string;
  billing_month: string; // Format YYYY-MM
  created_at: string;
  items?: TransactionItem[];
}

export interface LedgerMetrics {
  totalUdhaarGiven: number;
  totalJamaReceived: number;
  totalAdvanceDeposits: number;
  netPendingBalance: number;
}

export interface MonthlyDispatchCustomer {
  customer: Customer;
  openingBalance: number;
  monthlyUdhaar: number;
  monthlyJama: number;
  closingBalance: number;
  dispatched?: boolean;
}
