import { Type } from 'class-transformer';
import { IsDateString, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateGoalDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsPositive({ message: 'targetAmount must be a positive number.' })
  targetAmount?: number;

  @IsOptional()
  @IsString()
  category?: string | null;

  @IsOptional()
  @IsDateString()
  deadline?: string | null;
}
