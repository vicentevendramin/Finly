import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
} from 'class-validator';
import { TransactionType } from '../entities/transaction.entity.js';

export class CreateTransactionDto {
  @IsNotEmpty({ message: 'Required fields: description, amount, type.' })
  description: string;

  @Type(() => Number)
  @IsPositive({ message: 'amount must be a positive number.' })
  amount: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsEnum(TransactionType, { message: 'type must be "income" or "expense".' })
  type: TransactionType;

  /** Category id, or null/omitted for an uncategorized transaction. */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'categoryId must be a category id.' })
  categoryId?: number | null;
}
