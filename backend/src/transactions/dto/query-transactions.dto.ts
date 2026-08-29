import { IsOptional, Matches } from 'class-validator';

export class QueryTransactionsDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}$/, { message: 'month must be in the YYYY-MM format.' })
  month?: string;
}
