import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateGoalDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsPositive({ message: 'targetAmount must be a positive number.' })
  targetAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'categoryId must be a category id.' })
  categoryId?: number | null;

  @IsOptional()
  @IsDateString()
  deadline?: string | null;
}
