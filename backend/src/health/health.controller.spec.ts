import { ServiceUnavailableException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DataSource } from 'typeorm';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  let dataSource: { query: ReturnType<typeof vi.fn> };
  let controller: HealthController;

  beforeEach(() => {
    dataSource = { query: vi.fn() };
    controller = new HealthController(dataSource as unknown as DataSource);
  });

  it('reports ok when the database responds', async () => {
    dataSource.query.mockResolvedValue([{ '?column?': 1 }]);

    const result = await controller.check();

    expect(result.status).toBe('ok');
  });

  it('throws ServiceUnavailableException when the database is unreachable', async () => {
    dataSource.query.mockRejectedValue(new Error('connection refused'));

    await expect(controller.check()).rejects.toThrow(ServiceUnavailableException);
  });
});
