import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bootstrapTestApp } from './utils/bootstrap-app.js';

async function registerAndLogin(app: INestApplication, email: string) {
  const res = await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email, password: 'password123' })
    .expect(201);
  return res.body.token as string;
}

describe('Reports (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    app = await bootstrapTestApp();
    token = await registerAndLogin(app, `e2e-reports-${randomUUID()}@example.com`);

    const category = async (name: string, type: 'income' | 'expense' | 'both') => {
      const res = await request(app.getHttpServer())
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name, emoji: '🏷️', color: '#2563eb', type })
        .expect(201);
      return Number(res.body.id);
    };
    const work = await category(`Work-${randomUUID().slice(0, 8)}`, 'income');
    const housing = await category(`Housing-${randomUUID().slice(0, 8)}`, 'expense');
    const food = await category(`Food-${randomUUID().slice(0, 8)}`, 'expense');

    const tx = (body: Record<string, unknown>) =>
      request(app.getHttpServer())
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send(body)
        .expect(201);

    await tx({ description: 'Salary', amount: 5000, type: 'income', categoryId: work, date: '2026-07-05' });
    await tx({ description: 'Rent', amount: 1500, type: 'expense', categoryId: housing, date: '2026-07-10' });
    await tx({ description: 'Groceries', amount: 400, type: 'expense', categoryId: food, date: '2026-07-15' });
    await tx({ description: 'Freelance', amount: 800, type: 'income', categoryId: work, date: '2026-08-01' });
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects unauthenticated requests', async () => {
    await request(app.getHttpServer()).get('/api/reports/balance').expect(401);
  });

  it('returns balance grouped by period', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/reports/balance')
      .query({ from: '2026-07-01', to: '2026-08-31' })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toEqual([
      { period: '2026-07', income: 5000, expense: 1900, balance: 3100 },
      { period: '2026-08', income: 800, expense: 0, balance: 800 },
    ]);
  });

  it('returns category breakdown for expenses by default', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/reports/by-category')
      .query({ from: '2026-07-01', to: '2026-08-31' })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: expect.stringContaining('Housing'), total: 1500 }),
        expect.objectContaining({ name: expect.stringContaining('Food'), total: 400 }),
      ]),
    );
  });

  it('exports transactions as CSV', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/reports/export')
      .query({ format: 'csv', from: '2026-07-01', to: '2026-08-31' })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('id,description,amount,date,type,category');
    expect(res.text).toContain('Salary');
  });

  it('exports transactions as PDF', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/reports/export')
      .query({ format: 'pdf', from: '2026-07-01', to: '2026-08-31' })
      .set('Authorization', `Bearer ${token}`)
      .buffer(true)
      .parse((response, callback) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => callback(null, Buffer.concat(chunks)));
      })
      .expect(200);

    expect(res.headers['content-type']).toContain('application/pdf');
    expect((res.body as Buffer).subarray(0, 4).toString()).toBe('%PDF');
  });

  it('rejects an invalid export format', async () => {
    await request(app.getHttpServer())
      .get('/api/reports/export')
      .query({ format: 'xml' })
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });
});
