import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity.js';
import { Transaction } from '../transactions/entities/transaction.entity.js';
import { ErrorLog } from '../common/entities/error-log.entity.js';

export interface AdminStats {
  totalUsers: number;
  newUsers: number;
  totalTransactions: number;
  transactionsInPeriod: number;
}

export interface ErrorLogResponse {
  id: string;
  message: string;
  path: string;
  userId: string | null;
  createdAt: string;
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    @InjectRepository(ErrorLog)
    private readonly errorLogRepository: Repository<ErrorLog>,
  ) {}

  async getStats(from?: string, to?: string): Promise<AdminStats> {
    const totalUsers = await this.usersRepository.count();
    const totalTransactions = await this.transactionsRepository.count();

    const newUsersQb = this.usersRepository.createQueryBuilder('u');
    if (from) newUsersQb.andWhere('u.created_at >= :from', { from });
    if (to) newUsersQb.andWhere('u.created_at <= :to', { to });
    const newUsers = await newUsersQb.getCount();

    const txInPeriodQb = this.transactionsRepository.createQueryBuilder('t');
    if (from) txInPeriodQb.andWhere('t.date >= :from', { from });
    if (to) txInPeriodQb.andWhere('t.date <= :to', { to });
    const transactionsInPeriod = await txInPeriodQb.getCount();

    return { totalUsers, newUsers, totalTransactions, transactionsInPeriod };
  }

  async getErrors(limit = 50): Promise<ErrorLogResponse[]> {
    const errors = await this.errorLogRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return errors.map((e) => ({
      id: String(e.id),
      message: e.message,
      path: e.path,
      userId: e.userId !== null ? String(e.userId) : null,
      createdAt: e.createdAt.toISOString(),
    }));
  }
}
