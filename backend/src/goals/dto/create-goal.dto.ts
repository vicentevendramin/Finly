import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsPositive } from 'class-validator';

export class CreateGoalDto {
  @IsNotEmpty({ message: 'The goal name is required.' })
  name: string;

  @Type(() => Number)
  @IsPositive({ message: 'targetAmount must be a positive number.' })
  targetAmount: number;

  /** Optional category link, by id. */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'categoryId must be a category id.' })
  categoryId?: number | null;

  @IsOptional()
  @IsDateString()
  deadline?: string;
}
