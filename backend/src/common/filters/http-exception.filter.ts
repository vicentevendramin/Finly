import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Request, Response } from 'express';
import { ErrorLog } from '../entities/error-log.entity.js';
import type { JwtPayload } from '../../auth/strategies/jwt.strategy.js';

/**
 * Normalizes every error response to the {error: string} shape the frontend's
 * apiService.ts already expects, instead of Nest's default
 * {statusCode, message, error} shape. Also persists 5xx/unhandled errors to
 * ErrorLog for the admin panel.
 */
@Injectable()
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(
    @InjectRepository(ErrorLog)
    private readonly errorLogRepository: Repository<ErrorLog>,
  ) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { user?: JwtPayload }>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = isHttpException
      ? this.extractMessage(exception)
      : 'Internal server error.';

    if (!isHttpException || status >= 500) {
      this.logger.error(exception instanceof Error ? exception.stack : exception);
      await this.persistErrorLog(exception, request);
    }

    response.status(status).json({ error: message });
  }

  private async persistErrorLog(exception: unknown, request: Request & { user?: JwtPayload }) {
    try {
      const errorLog = this.errorLogRepository.create({
        message: exception instanceof Error ? exception.message : String(exception),
        stack: exception instanceof Error ? (exception.stack ?? null) : null,
        path: `${request.method} ${request.originalUrl ?? request.url}`,
        userId: request.user?.id ?? null,
      });
      await this.errorLogRepository.save(errorLog);
    } catch (persistError) {
      this.logger.error('Failed to persist ErrorLog', persistError as Error);
    }
  }

  private extractMessage(exception: HttpException): string {
    const response = exception.getResponse();
    if (typeof response === 'string') return response;
    if (
      typeof response === 'object' &&
      response !== null &&
      'message' in response
    ) {
      const { message } = response as { message: string | string[] };
      return Array.isArray(message) ? message[0] : message;
    }
    return exception.message;
  }
}
