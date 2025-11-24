
export interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  date: string; // ISO string
}

export interface QuickTransactionTemplate {
  id: string;
  name: string;
  category: string;
  defaultAmount: number;
}

export interface QuickTransactionState {
  id: string;
  amount: number;
  isPaid: boolean;
}

export type MonthlyTransactions = Record<string, Transaction[]>; // Key: "YYYY-M"
export type MonthlyQuickState = Record<string, Record<string, QuickTransactionState>>; // Key: "YYYY-M"
