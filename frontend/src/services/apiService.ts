import type {
  User,
  Transaction,
  NewTransactionData,
  Goal,
  NewGoalData,
  NewContributionData,
  BalancePeriod,
  CategoryTotal,
  AdminStats,
  AdminErrorLog,
} from '../types';

// ─── Base configuration ──────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Wrapper around fetch that:
 * - Injects the Authorization header automatically
 * - Throws a readable error when the response is not 2xx
 */
const apiFetch = async (path: string, options: RequestInit = {}): Promise<Response> => {
  const token = localStorage.getItem('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // If the response is not 2xx, extract the backend's error message and throw
  if (!response.ok) {
    // DELETE returns 204 with no body — handled before trying to parse
    if (response.status === 204) return response;

    const errorBody = await response.json().catch(() => ({ error: 'Unknown error.' }));
    throw new Error(errorBody.error || `HTTP error ${response.status}`);
  }

  return response;
};

// ─── Authentication services ─────────────────────────────────────────────────

/**
 * Checks whether there's a valid token in localStorage and validates it with the backend.
 * Replaces the mock's checkAuthStatus.
 */
const checkAuthStatus = async (): Promise<User | null> => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const response = await apiFetch('/auth/me');
    const data = await response.json();
    return data.user as User;
  } catch {
    // Expired or invalid token — clear localStorage
    localStorage.removeItem('token');
    return null;
  }
};

/**
 * Removes the token from localStorage (the backend doesn't need to be notified).
 */
const logout = async (): Promise<void> => {
  localStorage.removeItem('token');
};

// ─── apiService ───────────────────────────────────────────────────────────────

export const apiService = {
  /**
   * POST /api/auth/login
   */
  login: async (email: string, password: string): Promise<User> => {
    const response = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    // Store the token for subsequent requests
    localStorage.setItem('token', data.token);

    return data.user as User;
  },

  /**
   * POST /api/auth/register
   */
  register: async (email: string, password: string): Promise<User> => {
    const response = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    // Log the user in automatically after registration
    localStorage.setItem('token', data.token);

    return data.user as User;
  },

  /**
   * GET /api/transactions
   * Optionally filters by month: getTransactions('2025-11')
   */
  getTransactions: async (month?: string): Promise<Transaction[]> => {
    const query = month ? `?month=${month}` : '';
    const response = await apiFetch(`/transactions${query}`);
    return response.json() as Promise<Transaction[]>;
  },

  /**
   * POST /api/transactions
   */
  addTransaction: async (data: NewTransactionData): Promise<Transaction> => {
    const response = await apiFetch('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json() as Promise<Transaction>;
  },

  /**
   * PUT /api/transactions/:id
   */
  updateTransaction: async (id: string, data: NewTransactionData): Promise<Transaction> => {
    const response = await apiFetch(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json() as Promise<Transaction>;
  },

  /**
   * DELETE /api/transactions/:id
   */
  deleteTransaction: async (id: string): Promise<void> => {
    await apiFetch(`/transactions/${id}`, { method: 'DELETE' });
  },

  /**
   * GET /api/goals
   */
  getGoals: async (): Promise<Goal[]> => {
    const response = await apiFetch('/goals');
    return response.json() as Promise<Goal[]>;
  },

  /**
   * POST /api/goals
   */
  createGoal: async (data: NewGoalData): Promise<Goal> => {
    const response = await apiFetch('/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json() as Promise<Goal>;
  },

  /**
   * PATCH /api/goals/:id
   */
  updateGoal: async (id: string, data: NewGoalData): Promise<Goal> => {
    const response = await apiFetch(`/goals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.json() as Promise<Goal>;
  },

  /**
   * DELETE /api/goals/:id
   */
  deleteGoal: async (id: string): Promise<void> => {
    await apiFetch(`/goals/${id}`, { method: 'DELETE' });
  },

  /**
   * POST /api/goals/:id/contributions
   */
  addContribution: async (id: string, data: NewContributionData): Promise<Goal> => {
    const response = await apiFetch(`/goals/${id}/contributions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json() as Promise<Goal>;
  },

  /**
   * GET /api/reports/balance
   */
  getBalanceReport: async (from?: string, to?: string): Promise<BalancePeriod[]> => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await apiFetch(`/reports/balance${query}`);
    return response.json() as Promise<BalancePeriod[]>;
  },

  /**
   * GET /api/reports/by-category
   */
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

  /**
   * GET /api/reports/month-over-month
   */
  getMonthOverMonth: async (months?: number): Promise<BalancePeriod[]> => {
    const query = months ? `?months=${months}` : '';
    const response = await apiFetch(`/reports/month-over-month${query}`);
    return response.json() as Promise<BalancePeriod[]>;
  },

  /**
   * GET /api/reports/export
   * Returns the raw file (CSV/PDF) for download.
   */
  exportReport: async (format: 'csv' | 'pdf', from?: string, to?: string): Promise<Blob> => {
    const params = new URLSearchParams({ format });
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const response = await apiFetch(`/reports/export?${params.toString()}`);
    return response.blob();
  },

  /**
   * GET /api/admin/stats
   */
  getAdminStats: async (from?: string, to?: string): Promise<AdminStats> => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await apiFetch(`/admin/stats${query}`);
    return response.json() as Promise<AdminStats>;
  },

  /**
   * GET /api/admin/errors
   */
  getAdminErrors: async (limit?: number): Promise<AdminErrorLog[]> => {
    const query = limit ? `?limit=${limit}` : '';
    const response = await apiFetch(`/admin/errors${query}`);
    return response.json() as Promise<AdminErrorLog[]>;
  },

  checkAuthStatus,
  logout,
};
