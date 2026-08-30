import { describe, expect, it, vi } from 'vitest';
import type { Repository } from 'typeorm';
import { Category } from './entities/category.entity.js';
import { SEED_CATEGORIES, resolveSeedLocale, seedCategoriesForUser } from './category-seeds.js';

describe('category seeds', () => {
  it('resolves supported and fallback locales', () => {
    expect(resolveSeedLocale('en-US')).toBe('en-US');
    expect(resolveSeedLocale('pt-BR')).toBe('pt-BR');
    expect(resolveSeedLocale('en')).toBe('en-US');
    expect(resolveSeedLocale('fr-FR')).toBe('pt-BR');
    expect(resolveSeedLocale(undefined)).toBe('pt-BR');
  });

  it('saves one row per seed for the resolved locale, scoped to the user', async () => {
    const repo = {
      create: vi.fn((v) => v),
      save: vi.fn((v) => v),
    } as unknown as Repository<Category>;

    await seedCategoriesForUser(repo, 42, 'en-US');

    const saved = (repo.save as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(saved).toHaveLength(SEED_CATEGORIES['en-US'].length);
    expect(saved.every((row: { user: { id: number } }) => row.user.id === 42)).toBe(true);
  });
});
