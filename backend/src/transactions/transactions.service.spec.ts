import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Repository } from 'typeorm';
import { TransactionsService } from './transactions.service.js';
import { Transaction, TransactionType } from './entities/transaction.entity.js';

const buildTransaction = (overrides: Partial<Transaction> = {}): Transaction =>
  ({
    id: 1,
    user: { id: 10 } as Transaction['user'],
    description: 'Salary',
    amount: '5000.00',
    date: '2026-08-01',
    type: TransactionType.INCOME,
    category: 'Work',
    createdAt: new Date(),
    ...overrides,
  }) as Transaction;

describe('TransactionsService', () => {
  let repository: {
    createQueryBuilder: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let service: TransactionsService;

  beforeEach(() => {
    repository = {
      createQueryBuilder: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      findOne: vi.fn(),
      delete: vi.fn(),
    };
    service = new TransactionsService(repository as unknown as Repository<Transaction>);
  });

  describe('findAll', () => {
    it('serializes amount as a number and date as a string', async () => {
      const qb = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([buildTransaction()]),
      };
      repository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll(10);

      expect(result).toEqual([
        {
          id: '1',
          description: 'Salary',
          amount: 5000,
          date: '2026-08-01',
          type: 'income',
          category: 'Work',
        },
      ]);
      expect(qb.andWhere).not.toHaveBeenCalled();
    });

    it('filters by month when provided', async () => {
      const qb = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([]),
      };
      repository.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(10, '2026-08');

      expect(qb.andWhere).toHaveBeenCalledWith(
        "TO_CHAR(t.date, 'YYYY-MM') = :month",
        { month: '2026-08' },
      );
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the transaction does not belong to the user', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update(10, 1, {
          description: 'x',
          amount: 1,
          type: TransactionType.EXPENSE,
          category: 'y',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when nothing was deleted', async () => {
      repository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove(10, 1)).rejects.toThrow(NotFoundException);
    });

    it('resolves when the transaction was deleted', async () => {
      repository.delete.mockResolvedValue({ affected: 1 });

      await expect(service.remove(10, 1)).resolves.toBeUndefined();
      expect(repository.delete).toHaveBeenCalledWith({ id: 1, user: { id: 10 } });
    });
  });
});
