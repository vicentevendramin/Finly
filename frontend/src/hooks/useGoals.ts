import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/apiService';
import type { NewContributionData, NewGoalData } from '../types';

const GOALS_KEY = ['goals'];

export function useGoals() {
  return useQuery({
    queryKey: GOALS_KEY,
    queryFn: () => apiService.getGoals(),
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: NewGoalData) => apiService.createGoal(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GOALS_KEY }),
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: NewGoalData }) =>
      apiService.updateGoal(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GOALS_KEY }),
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiService.deleteGoal(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GOALS_KEY }),
  });
}

export function useAddContribution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: NewContributionData }) =>
      apiService.addContribution(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GOALS_KEY }),
  });
}
