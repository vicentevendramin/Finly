import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bootstrapTestApp } from './utils/bootstrap-app.js';

async function registerAndLogin(app: INestApplication, email: string, locale?: string) {
  const res = await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email, password: 'password123', locale })
    .expect(201);
  return res.body.token as string;
}

describe('Categories (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let tokenOther: string;

  beforeAll(async () => {
    app = await bootstrapTestApp();
    token = await registerAndLogin(app, `e2e-cat-${randomUUID()}@example.com`, 'en-US');
    tokenOther = await registerAndLogin(app, `e2e-cat-other-${randomUUID()}@example.com`);
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects unauthenticated requests', async () => {
    await request(app.getHttpServer()).get('/api/categories').expect(401);
  });

  it('seeds starter categories in the registration locale', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.length).toBeGreaterThanOrEqual(8);
    expect(res.body.map((c: { name: string }) => c.name)).toContain('Salary');
  });

  it('creates a category and rejects a duplicate name case-insensitively', async () => {
    const name = `Side gig ${randomUUID().slice(0, 6)}`;
    const created = await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name, emoji: '💻', color: '#0EA5E9', type: 'income' })
      .expect(201);
    expect(created.body).toMatchObject({ name, emoji: '💻', color: '#0ea5e9', type: 'income' });

    await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: name.toUpperCase(), emoji: '💰', color: '#0EA5E9', type: 'income' })
      .expect(409);
  });

  it('rejects an invalid colour', async () => {
    await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Bad', emoji: '❌', color: 'not-a-color', type: 'both' })
      .expect(400);
  });

  it('updates and deletes an owned category, and reports usage', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `Temp ${randomUUID().slice(0, 6)}`, emoji: '🗑️', color: '#888888', type: 'both' })
      .expect(201);
    const id = created.body.id as string;

    await request(app.getHttpServer())
      .patch(`/api/categories/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ emoji: '♻️', type: 'expense' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.emoji).toBe('♻️');
        expect(body.type).toBe('expense');
      });

    await request(app.getHttpServer())
      .get(`/api/categories/${id}/usage`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => expect(body.count).toBe(0));

    await request(app.getHttpServer())
      .delete(`/api/categories/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);
  });

  it('does not let a user touch another user\'s category', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `Mine ${randomUUID().slice(0, 6)}`, emoji: '🔒', color: '#111111', type: 'both' })
      .expect(201);
    const id = created.body.id as string;

    await request(app.getHttpServer())
      .patch(`/api/categories/${id}`)
      .set('Authorization', `Bearer ${tokenOther}`)
      .send({ name: 'Hijacked' })
      .expect(404);

    await request(app.getHttpServer())
      .delete(`/api/categories/${id}`)
      .set('Authorization', `Bearer ${tokenOther}`)
      .expect(404);
  });
});
