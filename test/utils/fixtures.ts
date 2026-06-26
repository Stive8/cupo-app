import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export const TEST_PASSWORD = 'password123';

export function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}@test.cupo`;
}

export interface TestUser {
  token: string;
  userId: string;
  email: string;
}

export async function registerAndLogin(
  app: INestApplication,
  role: 'customer' | 'business_owner',
  overrides: { email?: string; fullName?: string; phone?: string } = {},
): Promise<TestUser> {
  const email = overrides.email ?? uniqueEmail(role);

  const registerRes = await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      email,
      password: TEST_PASSWORD,
      fullName: overrides.fullName ?? 'Test User',
      role,
      phone: overrides.phone,
    })
    .expect(201);

  return {
    token: registerRes.body.data.accessToken,
    userId: registerRes.body.data.user.id,
    email,
  };
}

export async function createActiveBusiness(
  app: INestApplication,
  ownerToken: string,
  overrides: { name?: string; city?: string; depositPercentage?: number } = {},
): Promise<string> {
  const createRes = await request(app.getHttpServer())
    .post('/businesses')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({
      name: overrides.name ?? 'Cancha de prueba',
      address: 'Calle 1 # 2-3',
      city: overrides.city ?? 'Bogota',
      depositPercentage: overrides.depositPercentage,
    })
    .expect(201);

  const businessId = createRes.body.data.id;

  await request(app.getHttpServer())
    .post(`/businesses/${businessId}/publish`)
    .set('Authorization', `Bearer ${ownerToken}`)
    .expect(201);

  return businessId;
}

export async function createService(
  app: INestApplication,
  ownerToken: string,
  businessId: string,
  overrides: { name?: string; priceCents?: number; durationMinutes?: number } = {},
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/services')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({
      businessId,
      name: overrides.name ?? 'Cancha sintetica 1 hora',
      durationMinutes: overrides.durationMinutes ?? 60,
      priceCents: overrides.priceCents ?? 5_000_000,
    })
    .expect(201);

  return res.body.data.id;
}

export async function createSlot(
  app: INestApplication,
  ownerToken: string,
  businessId: string,
  serviceId: string,
  startTime: string,
  endTime: string,
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/slots')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ businessId, serviceId, startTime, endTime })
    .expect(201);

  return res.body.data.id;
}

export async function createBooking(
  app: INestApplication,
  customerToken: string,
  slotId: string,
): Promise<{ id: string; depositCents: number; totalCents: number }> {
  const res = await request(app.getHttpServer())
    .post('/bookings')
    .set('Authorization', `Bearer ${customerToken}`)
    .send({ slotId })
    .expect(201);

  return res.body.data;
}
