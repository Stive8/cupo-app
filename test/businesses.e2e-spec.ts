import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app';
import { createActiveBusiness, registerAndLogin, uniqueEmail } from './utils/fixtures';

describe('Businesses (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects a customer creating a business', async () => {
    const customer = await registerAndLogin(app, 'customer');

    await request(app.getHttpServer())
      .post('/businesses')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ name: 'Cancha', address: 'Calle 1', city: 'Bogota' })
      .expect(403);
  });

  it('creates a business with vertical sports_field, pending status and 30% deposit by default', async () => {
    const owner = await registerAndLogin(app, 'business_owner');

    const res = await request(app.getHttpServer())
      .post('/businesses')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Cancha El Gol', address: 'Calle 1', city: 'Cali' })
      .expect(201);

    expect(res.body.data.vertical).toBe('sports_field');
    expect(res.body.data.status).toBe('pending');
    expect(res.body.data.depositPercentage).toBe(30);
  });

  it('publishes a business and makes it visible in public search', async () => {
    const owner = await registerAndLogin(app, 'business_owner');
    const businessId = await createActiveBusiness(app, owner.token, { city: 'Medellin-e2e' });

    const res = await request(app.getHttpServer())
      .get('/businesses')
      .query({ city: 'Medellin-e2e' })
      .expect(200);

    expect(res.body.data.some((b: { id: string }) => b.id === businessId)).toBe(true);
  });

  it('does not expose a pending (unpublished) business via the public GET by id', async () => {
    const owner = await registerAndLogin(app, 'business_owner');
    const createRes = await request(app.getHttpServer())
      .post('/businesses')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Sin publicar', address: 'Calle 2', city: 'Bogota' })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/businesses/${createRes.body.data.id}`)
      .expect(404);
  });

  it('lets the owner update their own business deposit percentage', async () => {
    const owner = await registerAndLogin(app, 'business_owner');
    const businessId = await createActiveBusiness(app, owner.token);

    const res = await request(app.getHttpServer())
      .patch(`/businesses/${businessId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ depositPercentage: 50 })
      .expect(200);

    expect(res.body.data.depositPercentage).toBe(50);
  });

  it('forbids another owner from updating a business they do not own', async () => {
    const owner = await registerAndLogin(app, 'business_owner');
    const businessId = await createActiveBusiness(app, owner.token);

    const otherOwner = await registerAndLogin(app, 'business_owner', { email: uniqueEmail('other-owner') });

    await request(app.getHttpServer())
      .patch(`/businesses/${businessId}`)
      .set('Authorization', `Bearer ${otherOwner.token}`)
      .send({ depositPercentage: 99 })
      .expect(403);
  });
});
