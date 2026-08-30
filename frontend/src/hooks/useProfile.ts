import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/apiService';
import { useAuthStore } from '../store/authStore';
import type { UpdateProfileData, UpdateWorkData, UserProfile } from '../types';

const PROFILE_KEY = ['profile'];
const AVATAR_KEY = ['avatar'];

/** Keeps the sidebar's `user` object in sync with the fields the Settings page edits. */
function syncAuthUser(patch: Partial<{ displayName: string | null; avatarUpdatedAt: string | null }>) {
  const { user, setUser } = useAuthStore.getState();
  if (user) setUser({ ...user, ...patch });
}

export function useProfile() {
  return useQuery({
    queryKey: PROFILE_KEY,
    queryFn: () => apiService.getProfile(),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfileData) => apiService.updateProfile(data),
    onSuccess: (profile: UserProfile) => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY });
      syncAuthUser({ displayName: profile.displayName });
    },
  });
}

export function useUpdateWork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateWorkData) => apiService.updateWork(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROFILE_KEY }),
  });
}

export function useChangeEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ newEmail, currentPassword }: { newEmail: string; currentPassword: string }) =>
      apiService.changeEmail(newEmail, currentPassword),
    onSuccess: (user) => {
      useAuthStore.getState().setUser(user);
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      apiService.changePassword(currentPassword, newPassword),
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => apiService.uploadAvatar(file),
    onSuccess: (profile: UserProfile) => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY });
      queryClient.invalidateQueries({ queryKey: AVATAR_KEY });
      syncAuthUser({ avatarUpdatedAt: profile.avatarUpdatedAt });
    },
  });
}

export function useDeleteAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiService.deleteAvatar(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY });
      queryClient.invalidateQueries({ queryKey: AVATAR_KEY });
      syncAuthUser({ avatarUpdatedAt: null });
    },
  });
}

/** Fetches the current user's avatar as an object URL, re-fetching whenever `version` changes. */
export function useAvatar(enabled: boolean, version: string | null | undefined) {
  return useQuery({
    queryKey: [...AVATAR_KEY, version ?? null],
    enabled,
    staleTime: Infinity,
    queryFn: async () => {
      const blob = await apiService.getAvatarBlob();
      return URL.createObjectURL(blob);
    },
  });
}
