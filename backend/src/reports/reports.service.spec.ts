import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Repository } from 'typeorm';
import { ReportsService } from './reports.service.js';
import { Transaction, TransactionType } from '../transactions/entities/transaction.entity.js';

function buildQueryBuilder(overrides: Record<string, unknown> = {}) {
  const qb = {
    where: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    addSelect: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    getRawMany: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
  return qb;
}

describe('ReportsService', () => {
  let repo: { createQueryBuilder: ReturnType<typeof vi.fn> };
  let service: ReportsService;

  beforeEach(() => {
    repo = { createQueryBuilder: vi.fn() };
    service = new ReportsService(repo as unknown as Repository<Transaction>);
  });

  it('computes balance per period from raw grouped rows', async () => {
    const qb = buildQueryBuilder({
      getRawMany: vi.fn().mockResolvedValue([
        { period: '2026-07', income: '1000.00', expense: '400.00' },
        { period: '2026-08', income: '1200.00', expense: '900.50' },
      ]),
    });
    repo.createQueryBuilder.mockReturnValue(qb);

    const result = await service.getBalanceByPeriod(10);

    expect(result).toEqual([
      { period: '2026-07', income: 1000, expense: 400, balance: 600 },
      { period: '2026-08', income: 1200, expense: 900.5, balance: 299.5 },
    ]);
  });

  it('maps category breakdown rows to numbers', async () => {
    const qb = buildQueryBuilder({
      getRawMany: vi.fn().mockResolvedValue([
        { category: 'Alimentação', total: '250.75' },
        { category: 'Transporte', total: '120.00' },
      ]),
    });
    repo.createQueryBuilder.mockReturnValue(qb);

    const result = await service.getCategoryBreakdown(10, TransactionType.EXPENSE);

    expect(result).toEqual([
      { category: 'Alimentação', total: 250.75 },
      { category: 'Transporte', total: 120 },
    ]);
    expect(qb.andWhere).toHaveBeenCalledWith('t.type = :type', {
      type: TransactionType.EXPENSE,
    });
  });

  it('builds a CSV export with escaped fields', async () => {
    const qb = buildQueryBuilder({
      getRawMany: vi.fn().mockResolvedValue([
        {
          id: 1,
          description: 'Almoço, com salada',
          amount: '35.00',
          date: '2026-08-01',
          type: TransactionType.EXPENSE,
          category: 'Alimentação',
        },
      ]),
    });
    repo.createQueryBuilder.mockReturnValue(qb);

    const result = await service.exportTransactions(10, 'csv');

    expect(result.contentType).toBe('text/csv');
    const csv = result.buffer.toString('utf-8');
    expect(csv).toContain('id,description,amount,date,type,category');
    expect(csv).toContain('"Almoço, com salada"');
  });

  it('normalizes a raw Date object in the date column to YYYY-MM-DD', async () => {
    // pg returns `date`-typed columns as JS Date objects on raw queries
    // (unlike the repository layer, which normalizes to plain strings).
    const qb = buildQueryBuilder({
      getRawMany: vi.fn().mockResolvedValue([
        {
          id: 1,
          description: 'Salário',
          amount: '5000.00',
          date: new Date('2026-08-01T00:00:00.000Z'),
          type: TransactionType.INCOME,
          category: 'Trabalho',
        },
      ]),
    });
    repo.createQueryBuilder.mockReturnValue(qb);

    const result = await service.exportTransactions(10, 'csv');

    const csv = result.buffer.toString('utf-8');
    expect(csv).toContain('2026-08-01');
    expect(csv).not.toContain('GMT');
  });

  it('builds a non-empty PDF export', async () => {
    const qb = buildQueryBuilder({
      getRawMany: vi.fn().mockResolvedValue([
        {
          id: 1,
          description: 'Salário',
          amount: '5000.00',
          date: '2026-08-01',
          type: TransactionType.INCOME,
          category: 'Trabalho',
        },
      ]),
    });
    repo.createQueryBuilder.mockReturnValue(qb);

    const result = await service.exportTransactions(10, 'pdf');

    expect(result.contentType).toBe('application/pdf');
    expect(result.buffer.length).toBeGreaterThan(0);
    expect(result.buffer.subarray(0, 4).toString()).toBe('%PDF');
  });
});
