import type {
  User,
  Transaction,
  NewTransactionData,
  Category,
  NewCategoryData,
  Goal,
  NewGoalData,
  NewContributionData,
  BalancePeriod,
  CategoryTotal,
  UserProfile,
  UpdateProfileData,
  UpdateWorkData,
  AdminStats,
  AdminErrorLog,
} from '../types';

// ─── Base configuration ──────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Wrapper around fetch that:
 * - Injects the Authorization header automatically
 * - Leaves Content-Type unset for FormData bodies (the browser adds the boundary)
 * - Throws a readable error when the response is not 2xx
 */
const apiFetch = async (path: string, options: RequestInit = {}): Promise<Response> => {
  const token = localStorage.getItem('token');
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!response.ok) {
    if (response.status === 204) return response;

    const errorBody = await response.json().catch(() => ({ error: 'Unknown error.' }));
    throw new Error(errorBody.error || `HTTP error ${response.status}`);
  }

  return response;
};

// ─── Authentication services ─────────────────────────────────────────────────

const checkAuthStatus = async (): Promise<User | null> => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const response = await apiFetch('/auth/me');
    const data = await response.json();
    return data.user as User;
  } catch {
    localStorage.removeItem('token');
    return null;
  }
};

const logout = async (): Promise<void> => {
  localStorage.removeItem('token');
};

// ─── apiService ───────────────────────────────────────────────────────────────

export const apiService = {
  login: async (email: string, password: string): Promise<User> => {
    const response = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    localStorage.setItem('token', data.token);
    return data.user as User;
  },

  register: async (email: string, password: string, locale?: string): Promise<User> => {
    const response = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, locale }),
    });
    const data = await response.json();
    localStorage.setItem('token', data.token);
    return data.user as User;
  },

  // ── Transactions ──────────────────────────────────────────────────────────

  getTransactions: async (month?: string): Promise<Transaction[]> => {
    const query = month ? `?month=${month}` : '';
    const response = await apiFetch(`/transactions${query}`);
    return response.json() as Promise<Transaction[]>;
  },

  addTransaction: async (data: NewTransactionData): Promise<Transaction> => {
    const response = await apiFetch('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json() as Promise<Transaction>;
  },

  updateTransaction: async (id: string, data: NewTransactionData): Promise<Transaction> => {
    const response = await apiFetch(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json() as Promise<Transaction>;
  },

  deleteTransaction: async (id: string): Promise<void> => {
    await apiFetch(`/transactions/${id}`, { method: 'DELETE' });
  },

  // ── Categories ────────────────────────────────────────────────────────────

  getCategories: async (): Promise<Category[]> => {
    const response = await apiFetch('/categories');
    return response.json() as Promise<Category[]>;
  },

  createCategory: async (data: NewCategoryData): Promise<Category> => {
    const response = await apiFetch('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json() as Promise<Category>;
  },

  updateCategory: async (id: string, data: Partial<NewCategoryData>): Promise<Category> => {
    const response = await apiFetch(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.json() as Promise<Category>;
  },

  getCategoryUsage: async (id: string): Promise<number> => {
    const response = await apiFetch(`/categories/${id}/usage`);
    const data = await response.json();
    return data.count as number;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await apiFetch(`/categories/${id}`, { method: 'DELETE' });
  },

  // ── Goals ─────────────────────────────────────────────────────────────────

  getGoals: async (): Promise<Goal[]> => {
    const response = await apiFetch('/goals');
    return response.json() as Promise<Goal[]>;
  },

  createGoal: async (data: NewGoalData): Promise<Goal> => {
    const response = await apiFetch('/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json() as Promise<Goal>;
  },

  updateGoal: async (id: string, data: NewGoalData): Promise<Goal> => {
    const response = await apiFetch(`/goals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.json() as Promise<Goal>;
  },

  deleteGoal: async (id: string): Promise<void> => {
    await apiFetch(`/goals/${id}`, { method: 'DELETE' });
  },

  addContribution: async (id: string, data: NewContributionData): Promise<Goal> => {
    const response = await apiFetch(`/goals/${id}/contributions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json() as Promise<Goal>;
  },

  // ── Profile / Settings ────────────────────────────────────────────────────

  getProfile: async (): Promise<UserProfile> => {
    const response = await apiFetch('/users/me/profile');
    return response.json() as Promise<UserProfile>;
  },

  updateProfile: async (data: UpdateProfileData): Promise<UserProfile> => {
    const response = await apiFetch('/users/me/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.json() as Promise<UserProfile>;
  },

  updateWork: async (data: UpdateWorkData): Promise<UserProfile> => {
    const response = await apiFetch('/users/me/work', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.json() as Promise<UserProfile>;
  },

  changeEmail: async (newEmail: string, currentPassword: string): Promise<User> => {
    const response = await apiFetch('/users/me/email', {
      method: 'PATCH',
      body: JSON.stringify({ newEmail, currentPassword }),
    });
    const data = await response.json();
    localStorage.setItem('token', data.token);
    return data.user as User;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiFetch('/users/me/password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  uploadAvatar: async (file: File): Promise<UserProfile> => {
    const body = new FormData();
    body.append('file', file);
    const response = await apiFetch('/users/me/avatar', { method: 'POST', body });
    return response.json() as Promise<UserProfile>;
  },

  getAvatarBlob: async (): Promise<Blob> => {
    const response = await apiFetch('/users/me/avatar');
    return response.blob();
  },

  deleteAvatar: async (): Promise<void> => {
    await apiFetch('/users/me/avatar', { method: 'DELETE' });
  },

  // ── Reports ───────────────────────────────────────────────────────────────

  getBalanceReport: async (from?: string, to?: string): Promise<BalancePeriod[]> => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await apiFetch(`/reports/balance${query}`);
    return response.json() as Promise<BalancePeriod[]>;
  },

  getCategoryReport: async (
    type: 'income' | 'expense',
    from?: string,
    to?: string,
  ): Promise<CategoryTotal[]> => {
    const params = new URLSearchParams({ type });
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const response = await apiFetch(`/reports/by-category?${params.toString()}`);
    return response.json() as Promise<CategoryTotal[]>;
  },

  getMonthOverMonth: async (months?: number): Promise<BalancePeriod[]> => {
    const query = months ? `?months=${months}` : '';
    const response = await apiFetch(`/reports/month-over-month${query}`);
    return response.json() as Promise<BalancePeriod[]>;
  },

  exportReport: async (format: 'csv' | 'pdf', from?: string, to?: string): Promise<Blob> => {
    const params = new URLSearchParams({ format });
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const response = await apiFetch(`/reports/export?${params.toString()}`);
    return response.blob();
  },

  // ── Admin ─────────────────────────────────────────────────────────────────

  getAdminStats: async (from?: string, to?: string): Promise<AdminStats> => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await apiFetch(`/admin/stats${query}`);
    return response.json() as Promise<AdminStats>;
  },

  getAdminErrors: async (limit?: number): Promise<AdminErrorLog[]> => {
    const query = limit ? `?limit=${limit}` : '';
    const response = await apiFetch(`/admin/errors${query}`);
    return response.json() as Promise<AdminErrorLog[]>;
  },

  checkAuthStatus,
  logout,
};
