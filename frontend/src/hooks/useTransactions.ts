import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/apiService';
import type { NewTransactionData } from '../types';

const transactionsKey = (month?: string) => ['transactions', month] as const;

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] }),
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: NewTransactionData }) =>
      apiService.updateTransaction(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] }),
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiService.deleteTransaction(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] }),
  });
}
