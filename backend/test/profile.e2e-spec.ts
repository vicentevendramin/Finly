import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bootstrapTestApp } from './utils/bootstrap-app.js';

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

async function register(app: INestApplication, email: string) {
  const res = await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email, password: 'password123' })
    .expect(201);
  return res.body.token as string;
}

describe('Profile (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let email: string;

  beforeAll(async () => {
    app = await bootstrapTestApp();
    email = `e2e-profile-${randomUUID()}@example.com`;
    token = await register(app, email);
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects unauthenticated requests', async () => {
    await request(app.getHttpServer()).get('/api/users/me/profile').expect(401);
  });

  it('returns an empty profile for a new user', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/users/me/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      displayName: null,
      phone: null,
      hasAvatar: false,
      monthlyIncome: null,
    });
  });

  it('updates display name + phone and validates the phone format', async () => {
    await request(app.getHttpServer())
      .patch('/api/users/me/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ displayName: 'Vicente', phone: '+55 (11) 99999-1234' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.displayName).toBe('Vicente');
        expect(body.phone).toBe('+55 (11) 99999-1234');
      });

    await request(app.getHttpServer())
      .patch('/api/users/me/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: 'abc' })
      .expect(400);

    // display name now flows through /auth/me
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => expect(body.user.displayName).toBe('Vicente'));
  });

  it('stores work + income and derives a monthly figure', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/users/me/work')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employmentStatus: 'employed',
        incomeAmount: 8000,
        incomeFrequency: 'monthly',
        payDay: 5,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      employmentStatus: 'employed',
      incomeAmount: 8000,
      incomeFrequency: 'monthly',
      payDay: 5,
      monthlyIncome: 8000,
    });
  });

  it('changes the email only with the correct password, and rotates the token', async () => {
    const newEmail = `e2e-profile-new-${randomUUID()}@example.com`;

    await request(app.getHttpServer())
      .patch('/api/users/me/email')
      .set('Authorization', `Bearer ${token}`)
      .send({ newEmail, currentPassword: 'wrong' })
      .expect(401);

    const res = await request(app.getHttpServer())
      .patch('/api/users/me/email')
      .set('Authorization', `Bearer ${token}`)
      .send({ newEmail, currentPassword: 'password123' })
      .expect(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe(newEmail);
    token = res.body.token;

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'password123' })
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: newEmail, password: 'password123' })
      .expect(200);
    email = newEmail;
  });

  it('changes the password only with the correct current one', async () => {
    await request(app.getHttpServer())
      .patch('/api/users/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'nope', newPassword: 'new-password-123' })
      .expect(401);

    await request(app.getHttpServer())
      .patch('/api/users/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'password123', newPassword: 'new-password-123' })
      .expect(204);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'new-password-123' })
      .expect(200);
  });

  it('uploads, serves and deletes an avatar', async () => {
    await request(app.getHttpServer())
      .get('/api/users/me/avatar')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    await request(app.getHttpServer())
      .post('/api/users/me/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', PNG_1X1, { filename: 'a.png', contentType: 'image/png' })
      .expect(201)
      .expect(({ body }) => expect(body.hasAvatar).toBe(true));

    const img = await request(app.getHttpServer())
      .get('/api/users/me/avatar')
      .set('Authorization', `Bearer ${token}`)
      .buffer(true)
      .parse((res, cb) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => cb(null, Buffer.concat(chunks)));
      })
      .expect(200);
    expect(img.headers['content-type']).toContain('image/webp');
    expect((img.body as Buffer).length).toBeGreaterThan(0);

    await request(app.getHttpServer())
      .delete('/api/users/me/avatar')
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    await request(app.getHttpServer())
      .get('/api/users/me/avatar')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('rejects a non-image avatar upload', async () => {
    await request(app.getHttpServer())
      .post('/api/users/me/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('not an image'), {
        filename: 'x.txt',
        contentType: 'text/plain',
      })
      .expect(400);
  });
});
