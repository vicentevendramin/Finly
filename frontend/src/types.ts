export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  name?: string; // Deixamos 'name' como opcional, mas a API não o envia
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'income' | 'expense'; 
  category: string;
}

export type NewTransactionData = Omit<Transaction, 'id' | 'date'>;

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  category: string | null;
  deadline: string | null;
}

export interface NewGoalData {
  name: string;
  targetAmount: number;
  category?: string;
  deadline?: string;
}

export interface NewContributionData {
  amount: number;
  date?: string;
  note?: string;
}

export interface BalancePeriod {
  period: string;
  income: number;
  expense: number;
  balance: number;
}

export interface CategoryTotal {
  category: string;
  total: number;
}

export interface ReportDateRange {
  from?: string;
  to?: string;
}

export interface AdminStats {
  totalUsers: number;
  newUsers: number;
  totalTransactions: number;
  transactionsInPeriod: number;
}

export interface AdminErrorLog {
  id: string;
  message: string;
  path: string;
  userId: string | null;
  createdAt: string;
}
