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

export interface CategoryTotal {
  category: string;
  total: number;
}

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
  ): Promise<CategoryTotal[]> {
    const rows = await this.baseQuery(userId, from, to)
      .andWhere('t.type = :type', { type })
      .select('t.category', 'category')
      .addSelect('COALESCE(SUM(t.amount), 0)', 'total')
      .groupBy('t.category')
      .orderBy('total', 'DESC')
      .getRawMany<{ category: string; total: string }>();

    return rows.map((row) => ({ category: row.category, total: parseFloat(row.total) }));
  }

  async exportTransactions(
    userId: number,
    format: 'csv' | 'pdf',
    from?: string,
    to?: string,
  ): Promise<ExportResult> {
    const rawTransactions = await this.baseQuery(userId, from, to)
      .select('t.id', 'id')
      .addSelect('t.description', 'description')
      .addSelect('t.amount', 'amount')
      .addSelect('t.date', 'date')
      .addSelect('t.type', 'type')
      .addSelect('t.category', 'category')
      .orderBy('t.date', 'ASC')
      .getRawMany<{
        id: number;
        description: string;
        amount: string;
        date: string | Date;
        type: TransactionType;
        category: string;
      }>();

    // pg returns `date`-typed columns as JS Date objects when read via a raw
    // query (unlike TypeORM's entity/repository layer, which normalizes them
    // to plain strings) — normalize to YYYY-MM-DD here.
    const transactions = rawTransactions.map((t) => ({
      ...t,
      date: t.date instanceof Date ? t.date.toISOString().split('T')[0] : t.date,
    }));

    if (format === 'csv') {
      const csv = this.buildTransactionsCsv(transactions);
      return {
        buffer: Buffer.from(csv, 'utf-8'),
        filename: 'transacoes.csv',
        contentType: 'text/csv',
      };
    }

    const buffer = await this.buildTransactionsPdf(transactions);
    return { buffer, filename: 'transacoes.pdf', contentType: 'application/pdf' };
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

      doc.fontSize(16).text('Finly — Extrato de transações', { align: 'center' });
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
