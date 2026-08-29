import { describe, expect, it } from 'vitest';
import { MetricsService } from './metrics.service.js';

describe('MetricsService', () => {
  it('exposes Prometheus-formatted metrics including default process metrics', async () => {
    const service = new MetricsService();

    const output = await service.getMetrics();

    expect(output).toContain('http_requests_total');
    expect(output).toContain('http_request_duration_seconds');
    expect(service.contentType).toContain('text/plain');
  });

  it('reflects recorded requests in the exported metrics', async () => {
    const service = new MetricsService();

    service.httpRequestsTotal.inc({ method: 'GET', route: '/health', status_code: '200' });

    const output = await service.getMetrics();

    expect(output).toContain('method="GET"');
    expect(output).toContain('route="/health"');
  });
});
