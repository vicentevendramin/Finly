import type { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import type { Repository } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bootstrapTestApp } from './utils/bootstrap-app.js';
import { User, UserRole } from '../src/users/entities/user.entity.js';

async function registerAndLogin(app: INestApplication, email: string) {
  const res = await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email, password: 'senha123' })
    .expect(201);
  return res.body.token as string;
}

describe('Admin (e2e)', () => {
  let app: INestApplication;
  let userToken: string;
  let adminToken: string;

  beforeAll(async () => {
    app = await bootstrapTestApp();

    userToken = await registerAndLogin(app, `e2e-admin-user-${randomUUID()}@example.com`);

    const adminEmail = `e2e-admin-${randomUUID()}@example.com`;
    adminToken = await registerAndLogin(app, adminEmail);

    // No self-service promotion endpoint exists by design (see PLAN.md) —
    // promote directly via the repository, exactly how an operator would
    // via a one-off SQL statement in a real deployment.
    const usersRepository = app.get<Repository<User>>(getRepositoryToken(User));
    await usersRepository.update({ email: adminEmail }, { role: UserRole.ADMIN });

    // The JWT already minted above still carries role=user, so log in again
    // to get a token whose payload reflects the promotion.
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminEmail, password: 'senha123' })
      .expect(200);
    adminToken = login.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects unauthenticated requests', async () => {
    await request(app.getHttpServer()).get('/api/admin/stats').expect(401);
  });

  it('blocks a regular user with 403', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });

  it('allows an admin user to read stats', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toMatchObject({
      totalUsers: expect.any(Number),
      totalTransactions: expect.any(Number),
    });
    expect(res.body.totalUsers).toBeGreaterThanOrEqual(2);
  });

  it('blocks a regular user from reading error logs', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/errors')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });

  it('allows an admin user to read recent error logs', async () => {
    // Actual ErrorLog persistence on 5xx is covered by
    // http-exception.filter.spec.ts (unit) — this just checks the
    // role-gated endpoint itself responds correctly.
    const res = await request(app.getHttpServer())
      .get('/api/admin/errors')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });
});
