import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app';
import {
  createActiveBusiness,
  createService,
  createSlot,
  registerAndLogin,
} from './utils/fixtures';

describe('Bookings (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  async function setup(depositPercentage?: number) {
    const owner = await registerAndLogin(app, 'business_owner');
    const businessId = await createActiveBusiness(app, owner.token, { depositPercentage });
    const serviceId = await createService(app, owner.token, businessId, { priceCents: 5_000_000 });
    const customer = await registerAndLogin(app, 'customer');
    return { owner, businessId, serviceId, customer };
  }

  it('creates a booking with the deposit calculated from the business percentage', async () => {
    const { businessId, serviceId, customer, owner } = await setup(30);
    const slotId = await createSlot(
      app,
      owner.token,
      businessId,
      serviceId,
      '2027-03-01T10:00:00.000Z',
      '2027-03-01T11:00:00.000Z',
    );

    const res = await request(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ slotId })
      .expect(201);

    expect(res.body.data.totalCents).toBe(5_000_000);
    expect(res.body.data.depositCents).toBe(1_500_000);
    expect(res.body.data.status).toBe('pending');
  });

  it('rejects booking the same slot twice (capacity 1)', async () => {
    const { businessId, serviceId, customer, owner } = await setup();
    const slotId = await createSlot(
      app,
      owner.token,
      businessId,
      serviceId,
      '2027-03-02T10:00:00.000Z',
      '2027-03-02T11:00:00.000Z',
    );

    await request(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ slotId })
      .expect(201);

    const otherCustomer = await registerAndLogin(app, 'customer');
    await request(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${otherCustomer.token}`)
      .send({ slotId })
      .expect(409);
  });

  it('forbids a business_owner from creating a booking', async () => {
    const { businessId, serviceId, owner } = await setup();
    const slotId = await createSlot(
      app,
      owner.token,
      businessId,
      serviceId,
      '2027-03-03T10:00:00.000Z',
      '2027-03-03T11:00:00.000Z',
    );

    await request(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ slotId })
      .expect(403);
  });

  it('cancels a booking outside the 24h window and frees the slot', async () => {
    const { businessId, serviceId, customer, owner } = await setup();
    const slotId = await createSlot(
      app,
      owner.token,
      businessId,
      serviceId,
      '2027-03-04T10:00:00.000Z',
      '2027-03-04T11:00:00.000Z',
    );
    const booking = await request(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ slotId })
      .expect(201);

    const cancelRes = await request(app.getHttpServer())
      .post(`/bookings/${booking.body.data.id}/cancel`)
      .set('Authorization', `Bearer ${customer.token}`)
      .expect(201);
    expect(cancelRes.body.data.status).toBe('cancelled');

    const slots = await request(app.getHttpServer())
      .get(`/slots/business/${businessId}`)
      .expect(200);
    expect(slots.body.data.some((s: { id: string }) => s.id === slotId)).toBe(true);
  });

  it('rejects cancelling a booking inside the 24h window', async () => {
    const { businessId, serviceId, customer, owner } = await setup();
    const soon = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const soonEnd = new Date(soon.getTime() + 60 * 60 * 1000);
    const slotId = await createSlot(
      app,
      owner.token,
      businessId,
      serviceId,
      soon.toISOString(),
      soonEnd.toISOString(),
    );
    const booking = await request(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ slotId })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/bookings/${booking.body.data.id}/cancel`)
      .set('Authorization', `Bearer ${customer.token}`)
      .expect(400);
  });

  it('forbids cancelling someone else booking', async () => {
    const { businessId, serviceId, customer, owner } = await setup();
    const slotId = await createSlot(
      app,
      owner.token,
      businessId,
      serviceId,
      '2027-03-05T10:00:00.000Z',
      '2027-03-05T11:00:00.000Z',
    );
    const booking = await request(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ slotId })
      .expect(201);

    const otherCustomer = await registerAndLogin(app, 'customer');
    await request(app.getHttpServer())
      .post(`/bookings/${booking.body.data.id}/cancel`)
      .set('Authorization', `Bearer ${otherCustomer.token}`)
      .expect(403);
  });
});
