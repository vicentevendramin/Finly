import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsPositive, Max } from 'class-validator';
import { TransactionType } from '../../transactions/entities/transaction.entity.js';

export class ReportQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

export class CategoryReportQueryDto extends ReportQueryDto {
  @IsOptional()
  @IsIn(Object.values(TransactionType))
  type?: TransactionType;
}

export class MonthOverMonthQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Max(60)
  months?: number;
}

export class ExportQueryDto extends ReportQueryDto {
  @IsIn(['csv', 'pdf'])
  format: 'csv' | 'pdf';
}
