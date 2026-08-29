import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service.js';
import {
  CategoryReportQueryDto,
  ExportQueryDto,
  MonthOverMonthQueryDto,
  ReportQueryDto,
} from './dto/report-query.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('balance')
  getBalance(@CurrentUser() user: JwtPayload, @Query() query: ReportQueryDto) {
    return this.reportsService.getBalanceByPeriod(user.id, query.from, query.to);
  }

  @Get('by-category')
  getByCategory(@CurrentUser() user: JwtPayload, @Query() query: CategoryReportQueryDto) {
    return this.reportsService.getCategoryBreakdown(
      user.id,
      query.type,
      query.from,
      query.to,
    );
  }

  @Get('month-over-month')
  getMonthOverMonth(
    @CurrentUser() user: JwtPayload,
    @Query() query: MonthOverMonthQueryDto,
  ) {
    return this.reportsService.getMonthOverMonth(user.id, query.months);
  }

  @Get('export')
  async export(
    @CurrentUser() user: JwtPayload,
    @Query() query: ExportQueryDto,
    @Res() res: Response,
  ) {
    const { buffer, filename, contentType } = await this.reportsService.exportTransactions(
      user.id,
      query.format,
      query.from,
      query.to,
    );
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(buffer);
  }
}
