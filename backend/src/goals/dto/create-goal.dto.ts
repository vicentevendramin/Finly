import { Type } from 'class-transformer';
import { IsDateString, IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateGoalDto {
  @IsNotEmpty({ message: 'The goal name is required.' })
  name: string;

  @Type(() => Number)
  @IsPositive({ message: 'targetAmount must be a positive number.' })
  targetAmount: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;
}
