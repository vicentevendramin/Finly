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
      .send({ description: '', amount: -5, type: 'bogus', category: '' })
      .expect(400);
  });

  it('creates, lists, updates and deletes a transaction for the owner', async () => {
    const create = await request(app.getHttpServer())
      .post('/api/transactions')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        description: 'Salary',
        amount: 5000,
        type: 'income',
        category: 'Work',
        date: '2026-08-01',
      })
      .expect(201);

    expect(create.body).toMatchObject({
      description: 'Salary',
      amount: 5000,
      type: 'income',
      category: 'Work',
      date: '2026-08-01',
    });
    const id = create.body.id as string;

    const list = await request(app.getHttpServer())
      .get('/api/transactions')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    expect(list.body.some((t: { id: string }) => t.id === id)).toBe(true);

    await request(app.getHttpServer())
      .put(`/api/transactions/${id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        description: 'Adjusted salary',
        amount: 5500,
        type: 'income',
        category: 'Work',
        date: '2026-08-01',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.description).toBe('Adjusted salary');
        expect(body.amount).toBe(5500);
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

  it("hides other users' transactions from list and blocks update/delete (ownership isolation)", async () => {
    const create = await request(app.getHttpServer())
      .post('/api/transactions')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        description: "User A's private",
        amount: 100,
        type: 'expense',
        category: 'Personal',
      })
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
      .send({
        description: 'Attempt to change',
        amount: 1,
        type: 'expense',
        category: 'Personal',
      })
      .expect(404);

    await request(app.getHttpServer())
      .delete(`/api/transactions/${id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);
  });
});
