import type { Repository } from 'typeorm';
import { Category, CategoryType } from './entities/category.entity.js';

interface SeedCategory {
  name: string;
  emoji: string;
  color: string;
  type: CategoryType;
}

/**
 * Starter categories created for every new user at registration, in whichever
 * UI language they registered under (falls back to pt-BR). Users are free to
 * edit or delete any of them afterwards.
 */
export const SEED_CATEGORIES: Record<string, SeedCategory[]> = {
  'pt-BR': [
    { name: 'Alimentação', emoji: '🍔', color: '#ef4444', type: CategoryType.EXPENSE },
    { name: 'Transporte', emoji: '🚌', color: '#f97316', type: CategoryType.EXPENSE },
    { name: 'Moradia', emoji: '🏠', color: '#3b82f6', type: CategoryType.EXPENSE },
    { name: 'Salário', emoji: '💰', color: '#22c55e', type: CategoryType.INCOME },
    { name: 'Lazer', emoji: '🎉', color: '#a855f7', type: CategoryType.EXPENSE },
    { name: 'Saúde', emoji: '⚕️', color: '#ec4899', type: CategoryType.EXPENSE },
    { name: 'Educação', emoji: '📚', color: '#14b8a6', type: CategoryType.EXPENSE },
    { name: 'Compras', emoji: '🛍️', color: '#eab308', type: CategoryType.EXPENSE },
    { name: 'Contas', emoji: '🧾', color: '#64748b', type: CategoryType.EXPENSE },
    { name: 'Outros', emoji: '💡', color: '#6366f1', type: CategoryType.BOTH },
  ],
  'en-US': [
    { name: 'Food', emoji: '🍔', color: '#ef4444', type: CategoryType.EXPENSE },
    { name: 'Transport', emoji: '🚌', color: '#f97316', type: CategoryType.EXPENSE },
    { name: 'Housing', emoji: '🏠', color: '#3b82f6', type: CategoryType.EXPENSE },
    { name: 'Salary', emoji: '💰', color: '#22c55e', type: CategoryType.INCOME },
    { name: 'Leisure', emoji: '🎉', color: '#a855f7', type: CategoryType.EXPENSE },
    { name: 'Health', emoji: '⚕️', color: '#ec4899', type: CategoryType.EXPENSE },
    { name: 'Education', emoji: '📚', color: '#14b8a6', type: CategoryType.EXPENSE },
    { name: 'Shopping', emoji: '🛍️', color: '#eab308', type: CategoryType.EXPENSE },
    { name: 'Bills', emoji: '🧾', color: '#64748b', type: CategoryType.EXPENSE },
    { name: 'Other', emoji: '💡', color: '#6366f1', type: CategoryType.BOTH },
  ],
};

export function resolveSeedLocale(locale?: string | null): string {
  if (!locale) return 'pt-BR';
  if (SEED_CATEGORIES[locale]) return locale;
  const base = locale.split('-')[0].toLowerCase();
  if (base === 'en') return 'en-US';
  return 'pt-BR';
}

/** Inserts the starter categories for a freshly created user. */
export async function seedCategoriesForUser(
  repository: Repository<Category>,
  userId: number,
  locale?: string | null,
): Promise<void> {
  const seeds = SEED_CATEGORIES[resolveSeedLocale(locale)];
  const rows = seeds.map((seed) =>
    repository.create({ ...seed, user: { id: userId } }),
  );
  await repository.save(rows);
}
