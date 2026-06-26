import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app';
import { TEST_PASSWORD, uniqueEmail } from './utils/fixtures';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers a customer and returns an access token', async () => {
    const email = uniqueEmail('customer');
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: TEST_PASSWORD, fullName: 'Cliente Test', role: 'customer' })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.role).toBe('customer');
  });

  it('rejects registering with the admin role', async () => {
    const email = uniqueEmail('admin');
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: TEST_PASSWORD, fullName: 'Hacker', role: 'admin' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it('rejects registering a duplicate email', async () => {
    const email = uniqueEmail('dup');
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: TEST_PASSWORD, fullName: 'Uno', role: 'customer' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: TEST_PASSWORD, fullName: 'Dos', role: 'customer' })
      .expect(409);
  });

  it('logs in with correct credentials', async () => {
    const email = uniqueEmail('login');
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: TEST_PASSWORD, fullName: 'Login Test', role: 'customer' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: TEST_PASSWORD })
      .expect(200);

    expect(res.body.data.accessToken).toBeDefined();
  });

  it('rejects login with wrong password', async () => {
    const email = uniqueEmail('wrongpass');
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: TEST_PASSWORD, fullName: 'Wrong Pass', role: 'customer' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'incorrecta' })
      .expect(401);
  });

  it('rejects a protected route without a token', async () => {
    await request(app.getHttpServer()).get('/businesses/me').expect(401);
  });

  it('allows a public route without a token', async () => {
    await request(app.getHttpServer()).get('/businesses').expect(200);
  });
});
