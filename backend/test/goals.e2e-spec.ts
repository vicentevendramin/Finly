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

describe('Goals (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    app = await bootstrapTestApp();
    token = await registerAndLogin(app, `e2e-goals-${randomUUID()}@example.com`);
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects unauthenticated requests', async () => {
    await request(app.getHttpServer()).get('/api/goals').expect(401);
  });

  it('creates a manual-only goal and tracks contributions', async () => {
    const create = await request(app.getHttpServer())
      .post('/api/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Emergency fund', targetAmount: 1000 })
      .expect(201);

    expect(create.body).toMatchObject({
      name: 'Emergency fund',
      targetAmount: 1000,
      currentAmount: 0,
      category: null,
    });
    const id = create.body.id as string;

    await request(app.getHttpServer())
      .post(`/api/goals/${id}/contributions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 200 })
      .expect(201)
      .expect(({ body }) => {
        expect(body.currentAmount).toBe(200);
      });

    await request(app.getHttpServer())
      .post(`/api/goals/${id}/contributions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 50.5 })
      .expect(201)
      .expect(({ body }) => {
        expect(body.currentAmount).toBe(250.5);
      });
  });

  it('combines manual contributions with linked-category income transactions (hybrid model)', async () => {
    const cat = await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `Travel-${randomUUID().slice(0, 8)}`, emoji: '✈️', color: '#3b82f6', type: 'both' })
      .expect(201);
    const categoryId = Number(cat.body.id);

    const create = await request(app.getHttpServer())
      .post('/api/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dream trip', targetAmount: 5000, categoryId })
      .expect(201);
    expect(create.body.category).toMatchObject({ id: cat.body.id });
    const id = create.body.id as string;

    await request(app.getHttpServer())
      .post(`/api/goals/${id}/contributions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 100 })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Bonus', amount: 300, type: 'income', categoryId })
      .expect(201);

    // An expense in the same category must NOT count toward progress.
    await request(app.getHttpServer())
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Ticket', amount: 999, type: 'expense', categoryId })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/api/goals/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.currentAmount).toBe(400);
      });
  });

  it('updates and deletes a goal', async () => {
    const create = await request(app.getHttpServer())
      .post('/api/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Temporary', targetAmount: 10 })
      .expect(201);
    const id = create.body.id as string;

    await request(app.getHttpServer())
      .patch(`/api/goals/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Renamed' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.name).toBe('Renamed');
      });

    await request(app.getHttpServer())
      .delete(`/api/goals/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/api/goals/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });
});
