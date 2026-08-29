import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/apiService';

export function useBalanceReport(from?: string, to?: string) {
  return useQuery({
    queryKey: ['reports', 'balance', from, to],
    queryFn: () => apiService.getBalanceReport(from, to),
  });
}

export function useCategoryReport(type: 'income' | 'expense', from?: string, to?: string) {
  return useQuery({
    queryKey: ['reports', 'by-category', type, from, to],
    queryFn: () => apiService.getCategoryReport(type, from, to),
  });
}

export function useMonthOverMonth(months: number) {
  return useQuery({
    queryKey: ['reports', 'month-over-month', months],
    queryFn: () => apiService.getMonthOverMonth(months),
  });
}
