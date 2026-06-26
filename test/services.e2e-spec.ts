import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app';
import { createActiveBusiness, registerAndLogin } from './utils/fixtures';

describe('Services (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a service for the owner own business', async () => {
    const owner = await registerAndLogin(app, 'business_owner');
    const businessId = await createActiveBusiness(app, owner.token);

    const res = await request(app.getHttpServer())
      .post('/services')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ businessId, name: 'Cancha 1h', durationMinutes: 60, priceCents: 5_000_000 })
      .expect(201);

    expect(res.body.data.priceCents).toBe(5_000_000);
    expect(res.body.data.currency).toBe('COP');
  });

  it('forbids creating a service for a business owned by someone else', async () => {
    const ownerA = await registerAndLogin(app, 'business_owner');
    const businessId = await createActiveBusiness(app, ownerA.token);

    const ownerB = await registerAndLogin(app, 'business_owner');

    await request(app.getHttpServer())
      .post('/services')
      .set('Authorization', `Bearer ${ownerB.token}`)
      .send({ businessId, name: 'Intento ajeno', durationMinutes: 60, priceCents: 1_000_000 })
      .expect(403);
  });

  it('lists active services of a business publicly', async () => {
    const owner = await registerAndLogin(app, 'business_owner');
    const businessId = await createActiveBusiness(app, owner.token);

    await request(app.getHttpServer())
      .post('/services')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ businessId, name: 'Cancha 1h', durationMinutes: 60, priceCents: 5_000_000 })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get(`/services/business/${businessId}`)
      .expect(200);

    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
