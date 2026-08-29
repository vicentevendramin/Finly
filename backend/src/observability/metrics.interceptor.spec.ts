import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { MetricsInterceptor } from './metrics.interceptor.js';
import { MetricsService } from './metrics.service.js';

function buildContext(request: object, response: object) {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ExecutionContext;
}

describe('MetricsInterceptor', () => {
  let metricsService: MetricsService;
  let interceptor: MetricsInterceptor;

  beforeEach(() => {
    metricsService = new MetricsService();
    interceptor = new MetricsInterceptor(metricsService);
  });

  it('records a request/response pair using the matched route pattern', async () => {
    const context = buildContext(
      { method: 'GET', path: '/transactions/1', baseUrl: '', route: { path: '/transactions/:id' } },
      { statusCode: 200 },
    );
    const handler: CallHandler = { handle: () => of('ok') };

    await new Promise<void>((resolve) => {
      interceptor.intercept(context, handler).subscribe(() => resolve());
    });

    const output = await metricsService.getMetrics();
    expect(output).toContain('route="/transactions/:id"');
    expect(output).toContain('status_code="200"');
  });

  it('falls back to the raw path when no route pattern is available', async () => {
    const context = buildContext(
      { method: 'GET', path: '/unknown', baseUrl: '' },
      { statusCode: 404 },
    );
    const handler: CallHandler = { handle: () => of('ok') };

    await new Promise<void>((resolve) => {
      interceptor.intercept(context, handler).subscribe(() => resolve());
    });

    const output = await metricsService.getMetrics();
    expect(output).toContain('route="/unknown"');
  });

  it('still records metrics when the handler errors', async () => {
    const context = buildContext(
      { method: 'POST', path: '/transactions', baseUrl: '', route: { path: '/transactions' } },
      { statusCode: 500 },
    );
    const erroringHandler: CallHandler = { handle: () => throwError(() => new Error('boom')) };

    await new Promise<void>((resolve) => {
      interceptor.intercept(context, erroringHandler).subscribe({ error: () => resolve() });
    });

    const output = await metricsService.getMetrics();
    expect(output).toContain('status_code="500"');
  });
});
