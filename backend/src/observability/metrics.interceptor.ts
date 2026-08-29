import { Injectable, type CallHandler, type ExecutionContext, type NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { tap } from 'rxjs';
import { MetricsService } from './metrics.service.js';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const start = process.hrtime.bigint();
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();

    const record = () => {
      const response = httpContext.getResponse<Response>();
      const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
      const route = this.resolveRoute(request);
      const labels = {
        method: request.method,
        route,
        status_code: String(response.statusCode),
      };
      this.metricsService.httpRequestsTotal.inc(labels);
      this.metricsService.httpRequestDuration.observe(labels, durationSeconds);
    };

    return next.handle().pipe(tap({ next: record, error: record }));
  }

  private resolveRoute(request: Request): string {
    const routePath = (request as { route?: { path?: string } }).route?.path;
    return routePath ? `${request.baseUrl}${routePath}` : request.path;
  }
}
