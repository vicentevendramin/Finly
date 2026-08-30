import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { apiService } from '../services/apiService';
import type { NewCategoryData } from '../types';

const CATEGORIES_KEY = ['categories'];

// A category's name/emoji/colour is embedded on every transaction, goal and
// report row, so any category mutation can change how those render — refresh
// all of them.
function invalidateCategoryConsumers(queryClient: QueryClient) {
  for (const key of ['categories', 'transactions', 'goals', 'reports']) {
    queryClient.invalidateQueries({ queryKey: [key] });
  }
}

export function useCategories() {
  return useQuery({
    queryKey: CATEGORIES_KEY,
    queryFn: () => apiService.getCategories(),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: NewCategoryData) => apiService.createCategory(data),
    onSuccess: () => invalidateCategoryConsumers(queryClient),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NewCategoryData> }) =>
      apiService.updateCategory(id, data),
    onSuccess: () => invalidateCategoryConsumers(queryClient),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiService.deleteCategory(id),
    onSuccess: () => invalidateCategoryConsumers(queryClient),
  });
}
