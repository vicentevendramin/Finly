import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { apiService } from '../services/apiService';
import type { NewTransactionData } from '../types';

const transactionsKey = (month?: string) => ['transactions', month] as const;

// Goal progress is computed server-side from transactions (via the
// category link), so any transaction mutation can change a goal's
// currentAmount — invalidate both caches together.
function invalidateTransactionsAndGoals(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['transactions'] });
  queryClient.invalidateQueries({ queryKey: ['goals'] });
}

export function useTransactions(month?: string) {
  return useQuery({
    queryKey: transactionsKey(month),
    queryFn: () => apiService.getTransactions(month),
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: NewTransactionData) => apiService.addTransaction(data),
    onSuccess: () => invalidateTransactionsAndGoals(queryClient),
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: NewTransactionData }) =>
      apiService.updateTransaction(id, data),
    onSuccess: () => invalidateTransactionsAndGoals(queryClient),
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiService.deleteTransaction(id),
    onSuccess: () => invalidateTransactionsAndGoals(queryClient),
  });
}
