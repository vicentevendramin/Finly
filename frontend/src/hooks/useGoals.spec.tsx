import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryWrapper } from '../test/queryWrapper';
import { apiService } from '../services/apiService';
import { useAddContribution, useCreateGoal, useDeleteGoal, useGoals } from './useGoals';
import type { Goal } from '../types';

vi.mock('../services/apiService', () => ({
  apiService: {
    getGoals: vi.fn(),
    createGoal: vi.fn(),
    deleteGoal: vi.fn(),
    addContribution: vi.fn(),
  },
}));

const mockGoal: Goal = {
  id: '1',
  name: 'Dream trip',
  targetAmount: 2000,
  currentAmount: 450,
  category: { id: '7', name: 'Travel', emoji: '✈️', color: '#3b82f6', type: 'both' },
  deadline: null,
};

describe('useGoals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches goals', async () => {
    vi.mocked(apiService.getGoals).mockResolvedValue([mockGoal]);
    const { Wrapper } = createQueryWrapper();

    const { result } = renderHook(() => useGoals(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([mockGoal]);
  });

  it('invalidates the goals cache after creating a goal', async () => {
    vi.mocked(apiService.createGoal).mockResolvedValue(mockGoal);
    const { Wrapper, queryClient } = createQueryWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateGoal(), { wrapper: Wrapper });
    result.current.mutate({ name: 'Dream trip', targetAmount: 2000 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['goals'] });
  });

  it('invalidates the goals cache after adding a contribution', async () => {
    vi.mocked(apiService.addContribution).mockResolvedValue({ ...mockGoal, currentAmount: 600 });
    const { Wrapper, queryClient } = createQueryWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useAddContribution(), { wrapper: Wrapper });
    result.current.mutate({ id: '1', data: { amount: 150 } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiService.addContribution).toHaveBeenCalledWith('1', { amount: 150 });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['goals'] });
  });

  it('invalidates the goals cache after deleting a goal', async () => {
    vi.mocked(apiService.deleteGoal).mockResolvedValue(undefined);
    const { Wrapper, queryClient } = createQueryWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteGoal(), { wrapper: Wrapper });
    result.current.mutate('1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['goals'] });
  });
});
