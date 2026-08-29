import { Type } from 'class-transformer';
import { IsDateString, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateGoalDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsPositive({ message: 'targetAmount deve ser um número positivo.' })
  targetAmount?: number;

  @IsOptional()
  @IsString()
  category?: string | null;

  @IsOptional()
  @IsDateString()
  deadline?: string | null;
}
