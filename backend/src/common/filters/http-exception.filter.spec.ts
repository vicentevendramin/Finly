import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Repository } from 'typeorm';
import { HttpExceptionFilter } from './http-exception.filter.js';
import { ErrorLog } from '../entities/error-log.entity.js';

function buildHost(overrides: { user?: { id: number } } = {}) {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const response = { status };
  const request = {
    method: 'GET',
    originalUrl: '/api/transactions',
    user: overrides.user,
  };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as never;
  return { host, status, json };
}

describe('HttpExceptionFilter', () => {
  let errorLogRepo: { create: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn> };
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    errorLogRepo = { create: vi.fn((v) => v), save: vi.fn().mockResolvedValue(undefined) };
    filter = new HttpExceptionFilter(errorLogRepo as unknown as Repository<ErrorLog>);
  });

  it('normalizes an HttpException to the {error} shape without persisting it', async () => {
    const { host, status, json } = buildHost();

    await filter.catch(new BadRequestException('invalid email'), host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ error: 'invalid email' });
    expect(errorLogRepo.save).not.toHaveBeenCalled();
  });

  it('maps an unhandled error to 500 and persists an ErrorLog', async () => {
    const { host, status, json } = buildHost({ user: { id: 7 } });

    await filter.catch(new Error('db connection lost'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ error: 'Internal server error.' });
    expect(errorLogRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'db connection lost',
        path: 'GET /api/transactions',
        userId: 7,
      }),
    );
  });

  it('does not let a failed ErrorLog write break the error response', async () => {
    errorLogRepo.save.mockRejectedValue(new Error('db is down'));
    const { host, status, json } = buildHost();

    await expect(filter.catch(new Error('boom'), host)).resolves.toBeUndefined();
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ error: 'Internal server error.' });
  });
});
