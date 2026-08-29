import { Type } from 'class-transformer';
import { IsDateString, IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateGoalDto {
  @IsNotEmpty({ message: 'O nome da meta é obrigatório.' })
  name: string;

  @Type(() => Number)
  @IsPositive({ message: 'targetAmount deve ser um número positivo.' })
  targetAmount: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;
}
