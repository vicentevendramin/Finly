export type CategoryType = 'income' | 'expense' | 'both';

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
  type: CategoryType;
}

export interface NewCategoryData {
  name: string;
  emoji: string;
  color: string;
  type: CategoryType;
}

export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  displayName?: string | null;
  avatarUpdatedAt?: string | null;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
  category: Category | null;
}

export interface NewTransactionData {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId?: number | null;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  category: Category | null;
  deadline: string | null;
}

export interface NewGoalData {
  name: string;
  targetAmount: number;
  categoryId?: number | null;
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

/** A row of the reports "by category" breakdown. `categoryId` is null for the "Uncategorized" bucket. */
export interface CategoryTotal {
  categoryId: string | null;
  name: string | null;
  color: string | null;
  emoji: string | null;
  total: number;
}

export interface ReportDateRange {
  from?: string;
  to?: string;
}

export type EmploymentStatus =
  | 'employed'
  | 'self_employed'
  | 'student'
  | 'unemployed'
  | 'retired'
  | 'other';

export type IncomeFrequency = 'monthly' | 'biweekly' | 'weekly' | 'annual';

export interface UserProfile {
  displayName: string | null;
  phone: string | null;
  hasAvatar: boolean;
  avatarUpdatedAt: string | null;
  employmentStatus: EmploymentStatus | null;
  incomeAmount: number | null;
  incomeFrequency: IncomeFrequency | null;
  payDay: number | null;
  monthlyIncome: number | null;
}

export interface UpdateProfileData {
  displayName?: string | null;
  phone?: string | null;
}

export interface UpdateWorkData {
  employmentStatus?: EmploymentStatus | null;
  incomeAmount?: number | null;
  incomeFrequency?: IncomeFrequency | null;
  payDay?: number | null;
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
