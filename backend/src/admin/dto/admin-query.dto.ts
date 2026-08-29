import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsPositive, Max } from 'class-validator';

export class AdminStatsQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

export class AdminErrorsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Max(200)
  limit?: number;
}
