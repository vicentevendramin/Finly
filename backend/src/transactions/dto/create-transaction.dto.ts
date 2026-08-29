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
  @IsNotEmpty({ message: 'Required fields: description, amount, type, category.' })
  description: string;

  @Type(() => Number)
  @IsPositive({ message: 'amount must be a positive number.' })
  amount: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsEnum(TransactionType, { message: 'type must be "income" or "expense".' })
  type: TransactionType;

  @IsNotEmpty({ message: 'Required fields: description, amount, type, category.' })
  category: string;
}
