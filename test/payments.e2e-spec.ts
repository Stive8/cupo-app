import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app';
import {
  createActiveBusiness,
  createBooking,
  createService,
  createSlot,
  registerAndLogin,
} from './utils/fixtures';
import { buildWompiEvent } from './utils/wompi';

describe('Payments (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  async function setupPendingBooking(startTime: string, endTime: string) {
    const owner = await registerAndLogin(app, 'business_owner');
    const businessId = await createActiveBusiness(app, owner.token);
    const serviceId = await createService(app, owner.token, businessId, { priceCents: 5_000_000 });
    const customer = await registerAndLogin(app, 'customer');
    const slotId = await createSlot(app, owner.token, businessId, serviceId, startTime, endTime);
    const booking = await createBooking(app, customer.token, slotId);
    return { owner, businessId, serviceId, customer, slotId, booking };
  }

  it('initiates a payment and returns a reference with an integrity signature', async () => {
    const { customer, booking } = await setupPendingBooking(
      '2027-04-01T10:00:00.000Z',
      '2027-04-01T11:00:00.000Z',
    );

    const res = await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ bookingId: booking.id })
      .expect(201);

    expect(res.body.data.reference).toBeDefined();
    expect(res.body.data.amountCents).toBe(booking.depositCents);
    expect(res.body.data.integritySignature).toHaveLength(64);
  });

  it('rejects a webhook with an invalid signature', async () => {
    const { customer, booking } = await setupPendingBooking(
      '2027-04-02T10:00:00.000Z',
      '2027-04-02T11:00:00.000Z',
    );
    const payment = await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ bookingId: booking.id })
      .expect(201);

    const event = buildWompiEvent({
      reference: payment.body.data.reference,
      status: 'APPROVED',
      amountCents: booking.depositCents,
      secret: 'wrong_secret',
    });

    await request(app.getHttpServer()).post('/payments/webhook').send(event).expect(401);
  });

  it('approves a payment and confirms the booking', async () => {
    const { customer, booking } = await setupPendingBooking(
      '2027-04-03T10:00:00.000Z',
      '2027-04-03T11:00:00.000Z',
    );
    const payment = await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ bookingId: booking.id })
      .expect(201);

    const event = buildWompiEvent({
      reference: payment.body.data.reference,
      status: 'APPROVED',
      amountCents: booking.depositCents,
    });

    await request(app.getHttpServer()).post('/payments/webhook').send(event).expect(200);

    const bookings = await request(app.getHttpServer())
      .get('/bookings/me')
      .set('Authorization', `Bearer ${customer.token}`)
      .expect(200);
    const updated = bookings.body.data.find((b: { id: string }) => b.id === booking.id);
    expect(updated.status).toBe('confirmed');

    const paymentStatus = await request(app.getHttpServer())
      .get(`/payments/booking/${booking.id}`)
      .set('Authorization', `Bearer ${customer.token}`)
      .expect(200);
    expect(paymentStatus.body.data.status).toBe('approved');

    // Re-delivering the same event must be a no-op (idempotent webhook).
    await request(app.getHttpServer()).post('/payments/webhook').send(event).expect(200);
    const paymentStatusAfterRetry = await request(app.getHttpServer())
      .get(`/payments/booking/${booking.id}`)
      .set('Authorization', `Bearer ${customer.token}`)
      .expect(200);
    expect(paymentStatusAfterRetry.body.data.status).toBe('approved');
  });

  it('declines a payment, cancels the booking and frees the slot', async () => {
    const { customer, booking, slotId, businessId } = await setupPendingBooking(
      '2027-04-04T10:00:00.000Z',
      '2027-04-04T11:00:00.000Z',
    );
    const payment = await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ bookingId: booking.id })
      .expect(201);

    const event = buildWompiEvent({
      reference: payment.body.data.reference,
      status: 'DECLINED',
      amountCents: booking.depositCents,
    });

    await request(app.getHttpServer()).post('/payments/webhook').send(event).expect(200);

    const bookings = await request(app.getHttpServer())
      .get('/bookings/me')
      .set('Authorization', `Bearer ${customer.token}`)
      .expect(200);
    const updated = bookings.body.data.find((b: { id: string }) => b.id === booking.id);
    expect(updated.status).toBe('cancelled');

    const slots = await request(app.getHttpServer())
      .get(`/slots/business/${businessId}`)
      .expect(200);
    expect(slots.body.data.some((s: { id: string }) => s.id === slotId)).toBe(true);
  });

  it('forbids a customer from viewing another customer payment', async () => {
    const { customer, booking } = await setupPendingBooking(
      '2027-04-05T10:00:00.000Z',
      '2027-04-05T11:00:00.000Z',
    );
    await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ bookingId: booking.id })
      .expect(201);

    const otherCustomer = await registerAndLogin(app, 'customer');
    await request(app.getHttpServer())
      .get(`/payments/booking/${booking.id}`)
      .set('Authorization', `Bearer ${otherCustomer.token}`)
      .expect(403);
  });
});
