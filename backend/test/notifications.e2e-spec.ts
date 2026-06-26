import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
import { Notification, NotificationType } from '../src/notifications/entities/notification.entity';

describe('Notifications (e2e)', () => {
  let app: INestApplication;
  let notificationsRepository: Repository<Notification>;

  beforeAll(async () => {
    app = await createTestApp();
    notificationsRepository = app.get(getRepositoryToken(Notification));
  });

  afterAll(async () => {
    await app.close();
  });

  it('schedules confirmation and reminder notifications when a payment is approved', async () => {
    const owner = await registerAndLogin(app, 'business_owner');
    const businessId = await createActiveBusiness(app, owner.token);
    const serviceId = await createService(app, owner.token, businessId);
    const customer = await registerAndLogin(app, 'customer');
    const slotId = await createSlot(
      app,
      owner.token,
      businessId,
      serviceId,
      '2027-05-01T10:00:00.000Z',
      '2027-05-01T11:00:00.000Z',
    );
    const booking = await createBooking(app, customer.token, slotId);

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

    const notifications = await notificationsRepository.find({ where: { bookingId: booking.id } });

    expect(notifications).toHaveLength(6);
    expect(notifications.every((n) => n.userId === customer.userId)).toBe(true);

    const types = notifications.map((n) => n.type).sort();
    expect(types).toEqual(
      [
        NotificationType.CONFIRMATION,
        NotificationType.CONFIRMATION,
        NotificationType.REMINDER_1H,
        NotificationType.REMINDER_1H,
        NotificationType.REMINDER_24H,
        NotificationType.REMINDER_24H,
      ].sort(),
    );
  });

  it('schedules a cancellation notification for the business owner, not the customer', async () => {
    const owner = await registerAndLogin(app, 'business_owner');
    const businessId = await createActiveBusiness(app, owner.token);
    const serviceId = await createService(app, owner.token, businessId);
    const customer = await registerAndLogin(app, 'customer');
    const slotId = await createSlot(
      app,
      owner.token,
      businessId,
      serviceId,
      '2027-05-02T10:00:00.000Z',
      '2027-05-02T11:00:00.000Z',
    );
    const booking = await createBooking(app, customer.token, slotId);

    await request(app.getHttpServer())
      .post(`/bookings/${booking.id}/cancel`)
      .set('Authorization', `Bearer ${customer.token}`)
      .expect(201);

    const notifications = await notificationsRepository.find({ where: { bookingId: booking.id } });

    expect(notifications).toHaveLength(2);
    expect(notifications.every((n) => n.type === NotificationType.CANCELLATION)).toBe(true);
    expect(notifications.every((n) => n.userId === owner.userId)).toBe(true);
  });
});
