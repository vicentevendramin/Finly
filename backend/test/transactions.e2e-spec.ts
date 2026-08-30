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

async function createCategory(
  app: INestApplication,
  token: string,
  name: string,
  type: 'income' | 'expense' | 'both' = 'both',
) {
  const res = await request(app.getHttpServer())
    .post('/api/categories')
    .set('Authorization', `Bearer ${token}`)
    .send({ name, emoji: '🏷️', color: '#2563eb', type });
  if (res.status !== 201) {
    throw new Error(`createCategory ${res.status}: ${JSON.stringify(res.body)}`);
  }
  return res.body.id as string;
}

describe('Transactions (e2e)', () => {
  let app: INestApplication;
  let tokenA: string;
  let tokenB: string;

  beforeAll(async () => {
    app = await bootstrapTestApp();
    tokenA = await registerAndLogin(app, `e2e-tx-a-${randomUUID()}@example.com`);
    tokenB = await registerAndLogin(app, `e2e-tx-b-${randomUUID()}@example.com`);
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects unauthenticated requests', async () => {
    await request(app.getHttpServer()).get('/api/transactions').expect(401);
  });

  it('rejects invalid payloads', async () => {
    await request(app.getHttpServer())
      .post('/api/transactions')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ description: '', amount: -5, type: 'bogus' })
      .expect(400);
  });

  it('rejects a categoryId owned by another user', async () => {
    const foreignCategory = await createCategory(app, tokenB, `Foreign-${randomUUID().slice(0, 8)}`);
    await request(app.getHttpServer())
      .post('/api/transactions')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ description: 'x', amount: 1, type: 'expense', categoryId: Number(foreignCategory) })
      .expect(404);
  });

  it('creates a categorized transaction and an uncategorized one', async () => {
    const categoryId = await createCategory(app, tokenA, `Work-${randomUUID().slice(0, 8)}`, 'income');

    const categorized = await request(app.getHttpServer())
      .post('/api/transactions')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        description: 'Salary',
        amount: 5000,
        type: 'income',
        categoryId: Number(categoryId),
        date: '2026-08-01',
      })
      .expect(201);
    expect(categorized.body).toMatchObject({
      description: 'Salary',
      amount: 5000,
      category: { id: categoryId, name: expect.stringContaining('Work') },
    });

    const uncategorized = await request(app.getHttpServer())
      .post('/api/transactions')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ description: 'Found cash', amount: 20, type: 'income' })
      .expect(201);
    expect(uncategorized.body.category).toBeNull();
  });

  it('updates and deletes a transaction for the owner', async () => {
    const create = await request(app.getHttpServer())
      .post('/api/transactions')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ description: 'Temp', amount: 10, type: 'expense', date: '2026-08-01' })
      .expect(201);
    const id = create.body.id as string;

    await request(app.getHttpServer())
      .put(`/api/transactions/${id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ description: 'Adjusted', amount: 15, type: 'expense', date: '2026-08-01' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.description).toBe('Adjusted');
        expect(body.amount).toBe(15);
      });

    await request(app.getHttpServer())
      .delete(`/api/transactions/${id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(204);

    await request(app.getHttpServer())
      .delete(`/api/transactions/${id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(404);
  });

  it('sets a transaction to uncategorized when its category is deleted', async () => {
    const categoryId = await createCategory(app, tokenA, `Doomed-${randomUUID().slice(0, 8)}`, 'expense');
    const tx = await request(app.getHttpServer())
      .post('/api/transactions')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ description: 'Thing', amount: 30, type: 'expense', categoryId: Number(categoryId) })
      .expect(201);
    const txId = tx.body.id as string;

    await request(app.getHttpServer())
      .delete(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(204);

    const list = await request(app.getHttpServer())
      .get('/api/transactions')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    const row = list.body.find((t: { id: string }) => t.id === txId);
    expect(row.category).toBeNull();
  });

  it("hides other users' transactions and blocks update/delete (ownership isolation)", async () => {
    const create = await request(app.getHttpServer())
      .post('/api/transactions')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ description: "User A's private", amount: 100, type: 'expense' })
      .expect(201);
    const id = create.body.id as string;

    const listAsB = await request(app.getHttpServer())
      .get('/api/transactions')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);
    expect(listAsB.body.some((t: { id: string }) => t.id === id)).toBe(false);

    await request(app.getHttpServer())
      .put(`/api/transactions/${id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ description: 'Attempt to change', amount: 1, type: 'expense' })
      .expect(404);

    await request(app.getHttpServer())
      .delete(`/api/transactions/${id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);
  });
});
