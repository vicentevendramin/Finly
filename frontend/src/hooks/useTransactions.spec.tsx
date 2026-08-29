import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryWrapper } from '../test/queryWrapper';
import { apiService } from '../services/apiService';
import {
  useCreateTransaction,
  useDeleteTransaction,
  useTransactions,
  useUpdateTransaction,
} from './useTransactions';
import type { Transaction } from '../types';

vi.mock('../services/apiService', () => ({
  apiService: {
    getTransactions: vi.fn(),
    addTransaction: vi.fn(),
    updateTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
  },
}));

const mockTransaction: Transaction = {
  id: '1',
  description: 'Salary',
  amount: 5000,
  date: '2026-08-01',
  type: 'income',
  category: 'Work',
};

describe('useTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches transactions for the given month', async () => {
    vi.mocked(apiService.getTransactions).mockResolvedValue([mockTransaction]);
    const { Wrapper } = createQueryWrapper();

    const { result } = renderHook(() => useTransactions('2026-08'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiService.getTransactions).toHaveBeenCalledWith('2026-08');
    expect(result.current.data).toEqual([mockTransaction]);
  });

  it('invalidates the transactions and goals caches after creating a transaction', async () => {
    vi.mocked(apiService.addTransaction).mockResolvedValue(mockTransaction);
    const { Wrapper, queryClient } = createQueryWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateTransaction(), { wrapper: Wrapper });

    result.current.mutate({ description: 'Salary', amount: 5000, type: 'income', category: 'Work' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['transactions'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['goals'] });
  });

  it('invalidates caches after updating a transaction', async () => {
    vi.mocked(apiService.updateTransaction).mockResolvedValue(mockTransaction);
    const { Wrapper, queryClient } = createQueryWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateTransaction(), { wrapper: Wrapper });
    result.current.mutate({
      id: '1',
      data: { description: 'Salary', amount: 5500, type: 'income', category: 'Work' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiService.updateTransaction).toHaveBeenCalledWith('1', expect.objectContaining({ amount: 5500 }));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['goals'] });
  });

  it('invalidates caches after deleting a transaction', async () => {
    vi.mocked(apiService.deleteTransaction).mockResolvedValue(undefined);
    const { Wrapper, queryClient } = createQueryWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteTransaction(), { wrapper: Wrapper });
    result.current.mutate('1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['transactions'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['goals'] });
  });
});
