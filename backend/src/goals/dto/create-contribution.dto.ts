import { Type } from 'class-transformer';
import { IsDateString, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateContributionDto {
  @Type(() => Number)
  @IsPositive({ message: 'amount deve ser um número positivo.' })
  amount: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
