import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPositive,
} from 'class-validator';
import { TransactionType } from '../entities/transaction.entity.js';

export class CreateTransactionDto {
  @IsNotEmpty({ message: 'Campos obrigatórios: description, amount, type, category.' })
  description: string;

  @Type(() => Number)
  @IsPositive({ message: 'amount deve ser um número positivo.' })
  amount: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsEnum(TransactionType, { message: 'type deve ser "income" ou "expense".' })
  type: TransactionType;

  @IsNotEmpty({ message: 'Campos obrigatórios: description, amount, type, category.' })
  category: string;
}
