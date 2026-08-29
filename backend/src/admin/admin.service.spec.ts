import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Repository } from 'typeorm';
import { AdminService } from './admin.service.js';
import { User } from '../users/entities/user.entity.js';
import { Transaction } from '../transactions/entities/transaction.entity.js';
import { ErrorLog } from '../common/entities/error-log.entity.js';

function buildCountingQueryBuilder(count: number) {
  return {
    andWhere: vi.fn().mockReturnThis(),
    getCount: vi.fn().mockResolvedValue(count),
  };
}

describe('AdminService', () => {
  let usersRepo: { count: ReturnType<typeof vi.fn>; createQueryBuilder: ReturnType<typeof vi.fn> };
  let transactionsRepo: { count: ReturnType<typeof vi.fn>; createQueryBuilder: ReturnType<typeof vi.fn> };
  let errorLogRepo: { find: ReturnType<typeof vi.fn> };
  let service: AdminService;

  beforeEach(() => {
    usersRepo = {
      count: vi.fn().mockResolvedValue(5),
      createQueryBuilder: vi.fn().mockReturnValue(buildCountingQueryBuilder(2)),
    };
    transactionsRepo = {
      count: vi.fn().mockResolvedValue(40),
      createQueryBuilder: vi.fn().mockReturnValue(buildCountingQueryBuilder(12)),
    };
    errorLogRepo = { find: vi.fn().mockResolvedValue([]) };

    service = new AdminService(
      usersRepo as unknown as Repository<User>,
      transactionsRepo as unknown as Repository<Transaction>,
      errorLogRepo as unknown as Repository<ErrorLog>,
    );
  });

  it('aggregates totals and period counts into a single stats object', async () => {
    const result = await service.getStats('2026-08-01', '2026-08-31');

    expect(result).toEqual({
      totalUsers: 5,
      newUsers: 2,
      totalTransactions: 40,
      transactionsInPeriod: 12,
    });
  });

  it('serializes error logs with string ids', async () => {
    errorLogRepo.find.mockResolvedValue([
      {
        id: 1,
        message: 'boom',
        path: 'GET /api/transactions',
        userId: 7,
        createdAt: new Date('2026-08-01T00:00:00.000Z'),
      },
      {
        id: 2,
        message: 'unauthenticated failure',
        path: 'POST /api/auth/login',
        userId: null,
        createdAt: new Date('2026-08-02T00:00:00.000Z'),
      },
    ]);

    const result = await service.getErrors();

    expect(result).toEqual([
      {
        id: '1',
        message: 'boom',
        path: 'GET /api/transactions',
        userId: '7',
        createdAt: '2026-08-01T00:00:00.000Z',
      },
      {
        id: '2',
        message: 'unauthenticated failure',
        path: 'POST /api/auth/login',
        userId: null,
        createdAt: '2026-08-02T00:00:00.000Z',
      },
    ]);
  });
});
