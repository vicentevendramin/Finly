import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import PDFDocument from 'pdfkit';
import { Transaction, TransactionType } from '../transactions/entities/transaction.entity.js';

export interface BalancePeriod {
  period: string;
  income: number;
  expense: number;
  balance: number;
}

export interface CategoryBreakdownRow {
  categoryId: string | null;
  name: string | null;
  color: string | null;
  emoji: string | null;
  total: number;
}

const UNCATEGORIZED_LABEL = 'Uncategorized';

export interface ExportResult {
  buffer: Buffer;
  filename: string;
  contentType: string;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
  ) {}

  async getBalanceByPeriod(
    userId: number,
    from?: string,
    to?: string,
  ): Promise<BalancePeriod[]> {
    const qb = this.baseQuery(userId, from, to)
      .select("TO_CHAR(t.date, 'YYYY-MM')", 'period')
      .addSelect(
        "COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'income'), 0)",
        'income',
      )
      .addSelect(
        "COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'expense'), 0)",
        'expense',
      )
      .groupBy("TO_CHAR(t.date, 'YYYY-MM')")
      .orderBy("TO_CHAR(t.date, 'YYYY-MM')", 'ASC');

    const rows = await qb.getRawMany<{ period: string; income: string; expense: string }>();

    return rows.map((row) => {
      const income = parseFloat(row.income);
      const expense = parseFloat(row.expense);
      return { period: row.period, income, expense, balance: income - expense };
    });
  }

  async getMonthOverMonth(userId: number, months = 6): Promise<BalancePeriod[]> {
    const to = new Date();
    const from = new Date(to.getFullYear(), to.getMonth() - (months - 1), 1);
    return this.getBalanceByPeriod(
      userId,
      from.toISOString().split('T')[0],
      to.toISOString().split('T')[0],
    );
  }

  async getCategoryBreakdown(
    userId: number,
    type: TransactionType = TransactionType.EXPENSE,
    from?: string,
    to?: string,
  ): Promise<CategoryBreakdownRow[]> {
    const rows = await this.baseQuery(userId, from, to)
      .andWhere('t.type = :type', { type })
      .leftJoin('t.tag', 'tag')
      .select('tag.id', 'categoryId')
      .addSelect('tag.name', 'name')
      .addSelect('tag.color', 'color')
      .addSelect('tag.emoji', 'emoji')
      .addSelect('COALESCE(SUM(t.amount), 0)', 'total')
      .groupBy('tag.id')
      .addGroupBy('tag.name')
      .addGroupBy('tag.color')
      .addGroupBy('tag.emoji')
      .orderBy('total', 'DESC')
      .getRawMany<{
        categoryId: number | null;
        name: string | null;
        color: string | null;
        emoji: string | null;
        total: string;
      }>();

    return rows.map((row) => ({
      categoryId: row.categoryId != null ? String(row.categoryId) : null,
      name: row.name ?? null,
      color: row.color ?? null,
      emoji: row.emoji ?? null,
      total: parseFloat(row.total),
    }));
  }

  async exportTransactions(
    userId: number,
    format: 'csv' | 'pdf',
    from?: string,
    to?: string,
  ): Promise<ExportResult> {
    const rawTransactions = await this.baseQuery(userId, from, to)
      .leftJoin('t.tag', 'tag')
      .select('t.id', 'id')
      .addSelect('t.description', 'description')
      .addSelect('t.amount', 'amount')
      .addSelect('t.date', 'date')
      .addSelect('t.type', 'type')
      .addSelect('tag.name', 'category')
      .orderBy('t.date', 'ASC')
      .getRawMany<{
        id: number;
        description: string;
        amount: string;
        date: string | Date;
        type: TransactionType;
        category: string | null;
      }>();

    // pg returns `date`-typed columns as JS Date objects when read via a raw
    // query (unlike TypeORM's entity/repository layer, which normalizes them
    // to plain strings) — normalize to YYYY-MM-DD here. Uncategorized rows have
    // a null category name.
    const transactions = rawTransactions.map((t) => ({
      ...t,
      category: t.category ?? UNCATEGORIZED_LABEL,
      date: t.date instanceof Date ? t.date.toISOString().split('T')[0] : t.date,
    }));

    if (format === 'csv') {
      const csv = this.buildTransactionsCsv(transactions);
      return {
        buffer: Buffer.from(csv, 'utf-8'),
        filename: 'transactions.csv',
        contentType: 'text/csv',
      };
    }

    const buffer = await this.buildTransactionsPdf(transactions);
    return { buffer, filename: 'transactions.pdf', contentType: 'application/pdf' };
  }

  private buildTransactionsCsv(
    transactions: {
      id: number;
      description: string;
      amount: string;
      date: string;
      type: TransactionType;
      category: string;
    }[],
  ): string {
    const escape = (value: string) =>
      /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

    const header = 'id,description,amount,date,type,category';
    const rows = transactions.map((t) =>
      [
        t.id,
        escape(t.description),
        parseFloat(t.amount),
        t.date,
        t.type,
        escape(t.category),
      ].join(','),
    );
    return [header, ...rows].join('\n');
  }

  private buildTransactionsPdf(
    transactions: {
      description: string;
      amount: string;
      date: string;
      type: TransactionType;
      category: string;
    }[],
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(16).text('Finly — Transaction statement', { align: 'center' });
      doc.moveDown();

      transactions.forEach((t) => {
        const signal = t.type === TransactionType.INCOME ? '+' : '-';
        doc
          .fontSize(10)
          .text(
            `${t.date}  |  ${t.category.padEnd(20)}  |  ${t.description.padEnd(30)}  |  ${signal}R$ ${parseFloat(t.amount).toFixed(2)}`,
          );
      });

      doc.end();
    });
  }

  private baseQuery(userId: number, from?: string, to?: string) {
    const qb = this.transactionsRepository
      .createQueryBuilder('t')
      .where('t.user_id = :userId', { userId });

    if (from) qb.andWhere('t.date >= :from', { from });
    if (to) qb.andWhere('t.date <= :to', { to });

    return qb;
  }
}
