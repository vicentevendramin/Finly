import { Type } from 'class-transformer';
import { IsDateString, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateContributionDto {
  @Type(() => Number)
  @IsPositive({ message: 'amount must be a positive number.' })
  amount: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
