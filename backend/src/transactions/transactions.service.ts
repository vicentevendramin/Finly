import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity.js';
import { Category } from '../categories/entities/category.entity.js';
import {
  toCategoryResponse,
  type CategoryResponse,
} from '../categories/categories.service.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { UpdateTransactionDto } from './dto/update-transaction.dto.js';

export interface TransactionResponse {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: string;
  category: CategoryResponse | null;
}

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  async findAll(userId: number, month?: string): Promise<TransactionResponse[]> {
    const qb = this.transactionsRepository
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.tag', 'tag')
      .where('t.user_id = :userId', { userId })
      .orderBy('t.date', 'DESC')
      .addOrderBy('t.created_at', 'DESC');

    if (month) {
      qb.andWhere("TO_CHAR(t.date, 'YYYY-MM') = :month", { month });
    }

    const transactions = await qb.getMany();
    return transactions.map((t) => this.toResponse(t));
  }

  async create(
    userId: number,
    dto: CreateTransactionDto,
  ): Promise<TransactionResponse> {
    const tag = await this.resolveTag(userId, dto.categoryId);
    const transaction = this.transactionsRepository.create({
      user: { id: userId },
      description: dto.description.trim(),
      amount: String(dto.amount),
      date: dto.date ?? new Date().toISOString().split('T')[0],
      type: dto.type,
      tag,
    });
    const saved = await this.transactionsRepository.save(transaction);
    return this.toResponse({ ...saved, tag });
  }

  async update(
    userId: number,
    id: number,
    dto: UpdateTransactionDto,
  ): Promise<TransactionResponse> {
    const existing = await this.transactionsRepository.findOne({
      where: { id, user: { id: userId } },
      relations: { tag: true },
    });
    if (!existing) {
      throw new NotFoundException('Transaction not found.');
    }

    existing.description = dto.description.trim();
    existing.amount = String(dto.amount);
    if (dto.date) existing.date = dto.date;
    existing.type = dto.type;
    existing.tag = await this.resolveTag(userId, dto.categoryId ?? null);

    const saved = await this.transactionsRepository.save(existing);
    return this.toResponse(saved);
  }

  async remove(userId: number, id: number): Promise<void> {
    const result = await this.transactionsRepository.delete({
      id,
      user: { id: userId },
    });
    if (!result.affected) {
      throw new NotFoundException('Transaction not found.');
    }
  }

  private async resolveTag(
    userId: number,
    categoryId?: number | null,
  ): Promise<Category | null> {
    if (categoryId === undefined || categoryId === null) return null;
    const category = await this.categoriesRepository.findOne({
      where: { id: categoryId, user: { id: userId } },
    });
    if (!category) {
      throw new NotFoundException('Category not found.');
    }
    return category;
  }

  private toResponse(t: Transaction): TransactionResponse {
    return {
      id: String(t.id),
      description: t.description,
      amount: parseFloat(t.amount),
      date: t.date,
      type: t.type,
      category: t.tag ? toCategoryResponse(t.tag) : null,
    };
  }
}
