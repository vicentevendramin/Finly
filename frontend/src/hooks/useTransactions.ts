import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { apiService } from '../services/apiService';
import type { NewTransactionData } from '../types';

const transactionsKey = (month?: string) => ['transactions', month] as const;

// Goal progress and the reports aggregates are both computed server-side
// from transactions, so any transaction mutation can change a goal's
// currentAmount or a report total — invalidate all three caches together.
function invalidateTransactionsAndGoals(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['transactions'] });
  queryClient.invalidateQueries({ queryKey: ['goals'] });
  queryClient.invalidateQueries({ queryKey: ['reports'] });
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
