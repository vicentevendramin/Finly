import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, Max, Min, ValidateIf } from 'class-validator';
import {
  EmploymentStatus,
  IncomeFrequency,
} from '../../users/entities/user-profile.entity.js';

export class UpdateWorkDto {
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsEnum(EmploymentStatus, { message: 'Invalid employment status.' })
  employmentStatus?: EmploymentStatus | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Type(() => Number)
  @IsNumber({}, { message: 'The income must be a number.' })
  @Min(0, { message: 'The income cannot be negative.' })
  incomeAmount?: number | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsEnum(IncomeFrequency, { message: 'Invalid pay frequency.' })
  incomeFrequency?: IncomeFrequency | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Type(() => Number)
  @IsInt({ message: 'The pay day must be a whole number.' })
  @Min(1)
  @Max(31)
  payDay?: number | null;
}
