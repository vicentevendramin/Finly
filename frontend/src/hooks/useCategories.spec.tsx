import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryWrapper } from '../test/queryWrapper';
import { apiService } from '../services/apiService';
import { useCategories, useCreateCategory, useDeleteCategory } from './useCategories';
import type { Category } from '../types';

vi.mock('../services/apiService', () => ({
  apiService: {
    getCategories: vi.fn(),
    createCategory: vi.fn(),
    deleteCategory: vi.fn(),
  },
}));

const category: Category = {
  id: '1',
  name: 'Food',
  emoji: '🍔',
  color: '#ef4444',
  type: 'expense',
};

describe('useCategories', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches the category list', async () => {
    vi.mocked(apiService.getCategories).mockResolvedValue([category]);
    const { Wrapper } = createQueryWrapper();

    const { result } = renderHook(() => useCategories(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([category]);
  });

  it('invalidates every category consumer after a mutation', async () => {
    vi.mocked(apiService.createCategory).mockResolvedValue(category);
    const { Wrapper, queryClient } = createQueryWrapper();
    const spy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateCategory(), { wrapper: Wrapper });
    result.current.mutate({ name: 'Food', emoji: '🍔', color: '#ef4444', type: 'expense' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    for (const key of ['categories', 'transactions', 'goals', 'reports']) {
      expect(spy).toHaveBeenCalledWith({ queryKey: [key] });
    }
  });

  it('deletes a category by id', async () => {
    vi.mocked(apiService.deleteCategory).mockResolvedValue(undefined);
    const { Wrapper } = createQueryWrapper();

    const { result } = renderHook(() => useDeleteCategory(), { wrapper: Wrapper });
    result.current.mutate('1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiService.deleteCategory).toHaveBeenCalledWith('1');
  });
});
