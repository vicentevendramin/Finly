import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryWrapper } from '../test/queryWrapper';
import { apiService } from '../services/apiService';
import { useChangeEmail, useUpdateProfile } from './useProfile';
import { useAuthStore } from '../store/authStore';
import type { User } from '../types';

vi.mock('../services/apiService', () => ({
  apiService: {
    updateProfile: vi.fn(),
    changeEmail: vi.fn(),
  },
}));

const baseUser: User = { id: '1', email: 'old@example.com', role: 'user', displayName: null };

describe('useProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: baseUser });
  });

  it('pushes the new display name into the auth store', async () => {
    vi.mocked(apiService.updateProfile).mockResolvedValue({
      displayName: 'Vicente',
      phone: null,
      hasAvatar: false,
      avatarUpdatedAt: null,
      employmentStatus: null,
      incomeAmount: null,
      incomeFrequency: null,
      payDay: null,
      monthlyIncome: null,
    });
    const { Wrapper } = createQueryWrapper();

    const { result } = renderHook(() => useUpdateProfile(), { wrapper: Wrapper });
    result.current.mutate({ displayName: 'Vicente' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(useAuthStore.getState().user?.displayName).toBe('Vicente');
  });

  it('swaps the auth-store user after an email change', async () => {
    const updated: User = { ...baseUser, email: 'new@example.com' };
    vi.mocked(apiService.changeEmail).mockResolvedValue(updated);
    const { Wrapper } = createQueryWrapper();

    const { result } = renderHook(() => useChangeEmail(), { wrapper: Wrapper });
    result.current.mutate({ newEmail: 'new@example.com', currentPassword: 'pw' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiService.changeEmail).toHaveBeenCalledWith('new@example.com', 'pw');
    expect(useAuthStore.getState().user?.email).toBe('new@example.com');
  });
});
