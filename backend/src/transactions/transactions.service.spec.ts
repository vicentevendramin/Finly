import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Repository } from 'typeorm';
import { TransactionsService } from './transactions.service.js';
import { Transaction, TransactionType } from './entities/transaction.entity.js';
import { Category, CategoryType } from '../categories/entities/category.entity.js';

const category = {
  id: 5,
  name: 'Food',
  emoji: '🍔',
  color: '#ef4444',
  type: CategoryType.EXPENSE,
} as Category;

describe('TransactionsService', () => {
  let txRepo: {
    createQueryBuilder: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let categoriesRepo: { findOne: ReturnType<typeof vi.fn> };
  let service: TransactionsService;

  beforeEach(() => {
    txRepo = {
      createQueryBuilder: vi.fn(),
      create: vi.fn((v) => v),
      save: vi.fn((v) => ({ id: 1, ...v })),
      findOne: vi.fn(),
      delete: vi.fn(),
    };
    categoriesRepo = { findOne: vi.fn() };
    service = new TransactionsService(
      txRepo as unknown as Repository<Transaction>,
      categoriesRepo as unknown as Repository<Category>,
    );
  });

  it('embeds the resolved category on a created transaction', async () => {
    categoriesRepo.findOne.mockResolvedValue(category);

    const result = await service.create(10, {
      description: 'Lunch',
      amount: 30,
      type: TransactionType.EXPENSE,
      categoryId: 5,
    });

    expect(categoriesRepo.findOne).toHaveBeenCalledWith({
      where: { id: 5, user: { id: 10 } },
    });
    expect(result.category).toEqual({
      id: '5',
      name: 'Food',
      emoji: '🍔',
      color: '#ef4444',
      type: CategoryType.EXPENSE,
    });
  });

  it('creates an uncategorized transaction when no categoryId is given', async () => {
    const result = await service.create(10, {
      description: 'Misc',
      amount: 5,
      type: TransactionType.EXPENSE,
    });

    expect(categoriesRepo.findOne).not.toHaveBeenCalled();
    expect(result.category).toBeNull();
  });

  it('rejects a categoryId the user does not own', async () => {
    categoriesRepo.findOne.mockResolvedValue(null);

    await expect(
      service.create(10, {
        description: 'x',
        amount: 1,
        type: TransactionType.EXPENSE,
        categoryId: 999,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('re-resolves the tag on update and clears it when categoryId is omitted', async () => {
    txRepo.findOne.mockResolvedValue({
      id: 1,
      description: 'old',
      amount: '10.00',
      date: '2026-01-01',
      type: TransactionType.EXPENSE,
      tag: category,
    });

    const result = await service.update(10, 1, {
      description: 'new',
      amount: 12,
      type: TransactionType.EXPENSE,
    });

    expect(result.category).toBeNull();
  });

  it('maps the joined tag to a category on findAll', async () => {
    const qb = {
      leftJoinAndSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      addOrderBy: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue([
        {
          id: 2,
          description: 'Salary',
          amount: '1000.00',
          date: '2026-01-05',
          type: TransactionType.INCOME,
          tag: null,
        },
      ]),
    };
    txRepo.createQueryBuilder.mockReturnValue(qb);

    const [row] = await service.findAll(10);
    expect(row.category).toBeNull();
    expect(row.amount).toBe(1000);
  });
});
