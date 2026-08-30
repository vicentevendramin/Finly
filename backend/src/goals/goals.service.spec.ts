import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Repository } from 'typeorm';
import { GoalsService } from './goals.service.js';
import { Goal } from './entities/goal.entity.js';
import { GoalContribution } from './entities/goal-contribution.entity.js';
import { Transaction } from '../transactions/entities/transaction.entity.js';
import { Category, CategoryType } from '../categories/entities/category.entity.js';

function buildQueryBuilder(sum: string) {
  return {
    select: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    getRawOne: vi.fn().mockResolvedValue({ sum }),
  };
}

const travel = {
  id: 7,
  name: 'Travel',
  emoji: '✈️',
  color: '#3b82f6',
  type: CategoryType.BOTH,
} as Category;

describe('GoalsService', () => {
  let goalsRepo: {
    find: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let contributionsRepo: {
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    createQueryBuilder: ReturnType<typeof vi.fn>;
  };
  let transactionsRepo: { createQueryBuilder: ReturnType<typeof vi.fn> };
  let categoriesRepo: { findOne: ReturnType<typeof vi.fn> };
  let service: GoalsService;

  beforeEach(() => {
    goalsRepo = {
      find: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn((v) => v),
      save: vi.fn((v) => v),
      delete: vi.fn(),
    };
    contributionsRepo = {
      create: vi.fn((v) => v),
      save: vi.fn((v) => v),
      createQueryBuilder: vi.fn().mockReturnValue(buildQueryBuilder('0')),
    };
    transactionsRepo = {
      createQueryBuilder: vi.fn().mockReturnValue(buildQueryBuilder('0')),
    };
    categoriesRepo = { findOne: vi.fn() };
    service = new GoalsService(
      goalsRepo as unknown as Repository<Goal>,
      contributionsRepo as unknown as Repository<GoalContribution>,
      transactionsRepo as unknown as Repository<Transaction>,
      categoriesRepo as unknown as Repository<Category>,
    );
  });

  it('computes progress from manual contributions only when no category is linked', async () => {
    goalsRepo.findOne.mockResolvedValue({ id: 1, tag: null, targetAmount: '1000' });
    contributionsRepo.createQueryBuilder.mockReturnValue(buildQueryBuilder('150.00'));

    const result = await service.findOne(10, 1);

    expect(result.currentAmount).toBe(150);
    expect(result.category).toBeNull();
    expect(transactionsRepo.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('adds linked-category income transactions to manual contributions (hybrid model)', async () => {
    goalsRepo.findOne.mockResolvedValue({ id: 1, tag: travel, targetAmount: '1000' });
    contributionsRepo.createQueryBuilder.mockReturnValue(buildQueryBuilder('150.00'));
    transactionsRepo.createQueryBuilder.mockReturnValue(buildQueryBuilder('300.00'));

    const result = await service.findOne(10, 1);

    expect(result.currentAmount).toBe(450);
    expect(result.category).toMatchObject({ id: '7', name: 'Travel' });
  });

  it('validates the linked category belongs to the user on create', async () => {
    categoriesRepo.findOne.mockResolvedValue(null);

    await expect(
      service.create(10, { name: 'Trip', targetAmount: 5000, categoryId: 999 }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException for a goal not owned by the user', async () => {
    goalsRepo.findOne.mockResolvedValue(null);

    await expect(service.findOne(10, 999)).rejects.toThrow(NotFoundException);
  });

  it('adds a manual contribution and recomputes progress', async () => {
    const goal = { id: 1, tag: null, targetAmount: '1000' };
    goalsRepo.findOne.mockResolvedValue(goal);
    contributionsRepo.createQueryBuilder.mockReturnValue(buildQueryBuilder('50.00'));

    const result = await service.addContribution(10, 1, { amount: 50 });

    expect(contributionsRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ goal, amount: '50' }),
    );
    expect(contributionsRepo.save).toHaveBeenCalled();
    expect(result.currentAmount).toBe(50);
  });

  it('throws NotFoundException when removing a goal that does not belong to the user', async () => {
    goalsRepo.delete.mockResolvedValue({ affected: 0 });

    await expect(service.remove(10, 1)).rejects.toThrow(NotFoundException);
  });
});
