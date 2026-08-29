import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/apiService';

export function useAdminStats(from?: string, to?: string) {
  return useQuery({
    queryKey: ['admin', 'stats', from, to],
    queryFn: () => apiService.getAdminStats(from, to),
  });
}

export function useAdminErrors(limit = 50) {
  return useQuery({
    queryKey: ['admin', 'errors', limit],
    queryFn: () => apiService.getAdminErrors(limit),
  });
}
