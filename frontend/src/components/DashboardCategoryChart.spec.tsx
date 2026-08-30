import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardCategoryChart from './DashboardCategoryChart';
import { apiService } from '../services/apiService';
import { createQueryWrapper } from '../test/queryWrapper';
import type { Transaction } from '../types';

vi.mock('../services/apiService', () => ({
  apiService: { getTransactions: vi.fn() },
}));

// Recharts' ResponsiveContainer needs a measured box in jsdom.
vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 400, height: 300 }}>{children}</div>
    ),
  };
});

const month = new Date().toISOString().slice(0, 7);
const food = { id: '1', name: 'Food', emoji: '🍔', color: '#ef4444', type: 'expense' as const };

const transactions: Transaction[] = [
  { id: 'a', description: 'Lunch', amount: 30, date: `${month}-05`, type: 'expense', category: food },
  { id: 'b', description: 'Dinner', amount: 20, date: `${month}-06`, type: 'expense', category: food },
  { id: 'c', description: 'Bus', amount: 8, date: `${month}-07`, type: 'expense', category: null },
  { id: 'd', description: 'Salary', amount: 5000, date: `${month}-01`, type: 'income', category: null },
  { id: 'e', description: 'Old expense', amount: 999, date: '2020-01-01', type: 'expense', category: food },
];

describe('DashboardCategoryChart', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sums this month\'s expenses per category (ignoring income and other months)', async () => {
    vi.mocked(apiService.getTransactions).mockResolvedValue(transactions);
    const { Wrapper } = createQueryWrapper();

    render(<DashboardCategoryChart />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('🍔 Food')).toBeInTheDocument());
    expect(screen.getByText('R$ 50.00')).toBeInTheDocument(); // 30 + 20, not the 2020 one
    expect(screen.getByText('R$ 8.00')).toBeInTheDocument(); // uncategorized bus
    expect(screen.getByText('Sem categoria')).toBeInTheDocument();
    expect(screen.queryByText('R$ 5000.00')).not.toBeInTheDocument();
  });

  it('shows an empty state when there are no expenses this month', async () => {
    vi.mocked(apiService.getTransactions).mockResolvedValue([transactions[3], transactions[4]]);
    const { Wrapper } = createQueryWrapper();

    render(<DashboardCategoryChart />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByText('Nenhuma despesa registrada neste mês.')).toBeInTheDocument(),
    );
  });
});
