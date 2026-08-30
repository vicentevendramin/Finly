import { ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Repository } from 'typeorm';
import { CategoriesService } from './categories.service.js';
import { Category, CategoryType } from './entities/category.entity.js';

function queryBuilder(count: number) {
  return {
    where: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    getCount: vi.fn().mockResolvedValue(count),
  };
}

describe('CategoriesService', () => {
  let repo: {
    find: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    createQueryBuilder: ReturnType<typeof vi.fn>;
    manager: { createQueryBuilder: ReturnType<typeof vi.fn> };
  };
  let service: CategoriesService;

  beforeEach(() => {
    repo = {
      find: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn((v) => v),
      save: vi.fn((v) => ({ id: 1, ...v })),
      delete: vi.fn(),
      createQueryBuilder: vi.fn().mockReturnValue(queryBuilder(0)),
      manager: { createQueryBuilder: vi.fn().mockReturnValue(queryBuilder(0)) },
    };
    service = new CategoriesService(repo as unknown as Repository<Category>);
  });

  it('lists categories mapped to the response shape', async () => {
    repo.find.mockResolvedValue([
      { id: 3, name: 'Food', emoji: '🍔', color: '#ef4444', type: CategoryType.EXPENSE },
    ]);

    await expect(service.findAll(10)).resolves.toEqual([
      { id: '3', name: 'Food', emoji: '🍔', color: '#ef4444', type: CategoryType.EXPENSE },
    ]);
  });

  it('creates a category, defaulting type to "both" and lowercasing the color', async () => {
    const result = await service.create(10, {
      name: '  Groceries  ',
      emoji: '🛒',
      color: '#ABCDEF',
    });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user: { id: 10 },
        name: 'Groceries',
        emoji: '🛒',
        color: '#abcdef',
        type: CategoryType.BOTH,
      }),
    );
    expect(result).toMatchObject({ name: 'Groceries', type: CategoryType.BOTH });
  });

  it('rejects a duplicate name (case-insensitive)', async () => {
    repo.createQueryBuilder.mockReturnValue(queryBuilder(1));

    await expect(
      service.create(10, { name: 'food', emoji: '🍔', color: '#ef4444' }),
    ).rejects.toThrow(ConflictException);
  });

  it('throws NotFoundException updating a category the user does not own', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.update(10, 99, { name: 'x' })).rejects.toThrow(NotFoundException);
  });

  it('applies partial updates and re-checks name availability on rename', async () => {
    repo.findOne.mockResolvedValue({
      id: 1,
      name: 'Food',
      emoji: '🍔',
      color: '#ef4444',
      type: CategoryType.EXPENSE,
    });

    await service.update(10, 1, { name: 'Dining', type: CategoryType.BOTH });

    expect(repo.createQueryBuilder).toHaveBeenCalled(); // availability check ran
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Dining', type: CategoryType.BOTH }),
    );
  });

  it('does not run the availability check when the name is unchanged', async () => {
    repo.findOne.mockResolvedValue({
      id: 1,
      name: 'Food',
      emoji: '🍔',
      color: '#ef4444',
      type: CategoryType.EXPENSE,
    });

    await service.update(10, 1, { name: 'food', color: '#111111' });

    expect(repo.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('throws NotFoundException removing a category not owned by the user', async () => {
    repo.delete.mockResolvedValue({ affected: 0 });

    await expect(service.remove(10, 1)).rejects.toThrow(NotFoundException);
  });

  it('removes an owned category', async () => {
    repo.delete.mockResolvedValue({ affected: 1 });

    await expect(service.remove(10, 1)).resolves.toBeUndefined();
    expect(repo.delete).toHaveBeenCalledWith({ id: 1, user: { id: 10 } });
  });
});
