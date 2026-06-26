import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app';
import { createActiveBusiness, createService, registerAndLogin } from './utils/fixtures';

describe('Slots (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  async function setupBusinessAndService() {
    const owner = await registerAndLogin(app, 'business_owner');
    const businessId = await createActiveBusiness(app, owner.token);
    const serviceId = await createService(app, owner.token, businessId);
    return { owner, businessId, serviceId };
  }

  it('creates a slot and lists it publicly as available', async () => {
    const { owner, businessId, serviceId } = await setupBusinessAndService();

    const res = await request(app.getHttpServer())
      .post('/slots')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({
        businessId,
        serviceId,
        startTime: '2027-01-10T10:00:00.000Z',
        endTime: '2027-01-10T11:00:00.000Z',
      })
      .expect(201);

    expect(res.body.data.status).toBe('available');

    const list = await request(app.getHttpServer())
      .get(`/slots/business/${businessId}`)
      .expect(200);

    expect(list.body.data.some((s: { id: string }) => s.id === res.body.data.id)).toBe(true);
  });

  it('rejects a slot where endTime is before startTime', async () => {
    const { owner, businessId, serviceId } = await setupBusinessAndService();

    await request(app.getHttpServer())
      .post('/slots')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({
        businessId,
        serviceId,
        startTime: '2027-01-10T12:00:00.000Z',
        endTime: '2027-01-10T11:00:00.000Z',
      })
      .expect(400);
  });

  it('blocking a slot removes it from public availability, unblocking restores it', async () => {
    const { owner, businessId, serviceId } = await setupBusinessAndService();

    const createRes = await request(app.getHttpServer())
      .post('/slots')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({
        businessId,
        serviceId,
        startTime: '2027-01-15T10:00:00.000Z',
        endTime: '2027-01-15T11:00:00.000Z',
      })
      .expect(201);
    const slotId = createRes.body.data.id;

    await request(app.getHttpServer())
      .post(`/slots/${slotId}/block`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(201);

    const afterBlock = await request(app.getHttpServer())
      .get(`/slots/business/${businessId}`)
      .expect(200);
    expect(afterBlock.body.data.some((s: { id: string }) => s.id === slotId)).toBe(false);

    await request(app.getHttpServer())
      .post(`/slots/${slotId}/unblock`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(201);

    const afterUnblock = await request(app.getHttpServer())
      .get(`/slots/business/${businessId}`)
      .expect(200);
    expect(afterUnblock.body.data.some((s: { id: string }) => s.id === slotId)).toBe(true);
  });

  it('lets the owner manage all of their slots regardless of status (available/blocked)', async () => {
    const { owner, businessId, serviceId } = await setupBusinessAndService();
    const createRes = await request(app.getHttpServer())
      .post('/slots')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({
        businessId,
        serviceId,
        startTime: '2027-01-25T10:00:00.000Z',
        endTime: '2027-01-25T11:00:00.000Z',
      })
      .expect(201);
    const slotId = createRes.body.data.id;

    await request(app.getHttpServer())
      .post(`/slots/${slotId}/block`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(201);

    const manageList = await request(app.getHttpServer())
      .get(`/slots/business/${businessId}/manage`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(200);
    const found = manageList.body.data.find((s: { id: string }) => s.id === slotId);
    expect(found).toBeDefined();
    expect(found.status).toBe('blocked');

    const otherOwner = await registerAndLogin(app, 'business_owner');
    await request(app.getHttpServer())
      .get(`/slots/business/${businessId}/manage`)
      .set('Authorization', `Bearer ${otherOwner.token}`)
      .expect(403);
  });

  it('forbids an unrelated owner from blocking someone else slot', async () => {
    const { owner, businessId, serviceId } = await setupBusinessAndService();
    const createRes = await request(app.getHttpServer())
      .post('/slots')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({
        businessId,
        serviceId,
        startTime: '2027-01-20T10:00:00.000Z',
        endTime: '2027-01-20T11:00:00.000Z',
      })
      .expect(201);

    const otherOwner = await registerAndLogin(app, 'business_owner');

    await request(app.getHttpServer())
      .post(`/slots/${createRes.body.data.id}/block`)
      .set('Authorization', `Bearer ${otherOwner.token}`)
      .expect(403);
  });
});
