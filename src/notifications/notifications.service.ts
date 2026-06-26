import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { Resend } from 'resend';
import { Twilio } from 'twilio';
import { Booking } from '../bookings/entities/booking.entity';
import { User } from '../users/entities/user.entity';
import {
  Notification,
  NotificationChannel,
  NotificationStatus,
  NotificationType,
} from './entities/notification.entity';

const REMINDER_24H_MS = 24 * 60 * 60 * 1000;
const REMINDER_1H_MS = 60 * 60 * 1000;
const DISPATCH_BATCH_SIZE = 50;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly twilioClient: Twilio | null;
  private readonly resendClient: Resend | null;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {
    const twilioSid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const twilioToken = this.config.get<string>('TWILIO_AUTH_TOKEN');
    this.twilioClient = twilioSid && twilioToken ? new Twilio(twilioSid, twilioToken) : null;

    const resendApiKey = this.config.get<string>('RESEND_API_KEY');
    this.resendClient = resendApiKey ? new Resend(resendApiKey) : null;
  }

  async scheduleBookingConfirmed(userId: string, bookingId: string, slotStartTime: Date): Promise<void> {
    const now = new Date();
    const entries: { type: NotificationType; scheduledAt: Date }[] = [
      { type: NotificationType.CONFIRMATION, scheduledAt: now },
    ];

    const reminder24h = new Date(slotStartTime.getTime() - REMINDER_24H_MS);
    if (reminder24h > now) {
      entries.push({ type: NotificationType.REMINDER_24H, scheduledAt: reminder24h });
    }

    const reminder1h = new Date(slotStartTime.getTime() - REMINDER_1H_MS);
    if (reminder1h > now) {
      entries.push({ type: NotificationType.REMINDER_1H, scheduledAt: reminder1h });
    }

    await this.createForBothChannels(userId, bookingId, entries);
  }

  async scheduleBookingCancelled(userId: string, bookingId: string): Promise<void> {
    await this.createForBothChannels(userId, bookingId, [
      { type: NotificationType.CANCELLATION, scheduledAt: new Date() },
    ]);
  }

  private async createForBothChannels(
    userId: string,
    bookingId: string,
    entries: { type: NotificationType; scheduledAt: Date }[],
  ): Promise<void> {
    const rows = entries.flatMap((entry) =>
      [NotificationChannel.WHATSAPP, NotificationChannel.EMAIL].map((channel) =>
        this.notificationsRepository.create({
          userId,
          bookingId,
          channel,
          type: entry.type,
          status: NotificationStatus.PENDING,
          scheduledAt: entry.scheduledAt,
          sentAt: null,
        }),
      ),
    );
    await this.notificationsRepository.save(rows);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async dispatchPending(): Promise<void> {
    const pending = await this.notificationsRepository.find({
      where: { status: NotificationStatus.PENDING, scheduledAt: LessThanOrEqual(new Date()) },
      take: DISPATCH_BATCH_SIZE,
    });

    for (const notification of pending) {
      await this.send(notification);
    }
  }

  private async send(notification: Notification): Promise<void> {
    try {
      const [booking, recipient] = await Promise.all([
        this.bookingsRepository.findOne({
          where: { id: notification.bookingId },
          relations: { business: true, service: true, slot: true },
        }),
        this.usersRepository.findOne({ where: { id: notification.userId } }),
      ]);

      if (!booking || !recipient) {
        throw new Error('Booking o destinatario no encontrado');
      }

      const message = this.buildMessage(notification.type, booking);

      if (notification.channel === NotificationChannel.WHATSAPP) {
        if (!this.twilioClient) {
          throw new Error('Twilio no está configurado (TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN)');
        }
        if (!recipient.phone) {
          throw new Error('El destinatario no tiene teléfono registrado');
        }
        await this.twilioClient.messages.create({
          from: `whatsapp:${this.config.get<string>('TWILIO_WHATSAPP_FROM')}`,
          to: `whatsapp:${recipient.phone}`,
          body: message,
        });
      } else {
        if (!this.resendClient) {
          throw new Error('Resend no está configurado (RESEND_API_KEY)');
        }
        await this.resendClient.emails.send({
          from: this.config.get<string>('RESEND_FROM_EMAIL') ?? '',
          to: recipient.email,
          subject: this.buildSubject(notification.type),
          text: message,
        });
      }

      notification.status = NotificationStatus.SENT;
      notification.sentAt = new Date();
    } catch (error) {
      this.logger.warn(
        `No se pudo enviar la notificación ${notification.id}: ${(error as Error).message}`,
      );
      notification.status = NotificationStatus.FAILED;
    }

    await this.notificationsRepository.save(notification);
  }

  private buildSubject(type: NotificationType): string {
    switch (type) {
      case NotificationType.CONFIRMATION:
        return 'Tu reserva fue confirmada';
      case NotificationType.REMINDER_24H:
      case NotificationType.REMINDER_1H:
        return 'Recordatorio de tu reserva';
      case NotificationType.CANCELLATION:
        return 'Una reserva fue cancelada';
    }
  }

  private buildMessage(type: NotificationType, booking: Booking): string {
    const businessName = booking.business.name;
    const serviceName = booking.service.name;
    const startTime = booking.slot.startTime.toLocaleString('es-CO');

    switch (type) {
      case NotificationType.CONFIRMATION:
        return `Tu reserva de "${serviceName}" en ${businessName} para el ${startTime} fue confirmada.`;
      case NotificationType.REMINDER_24H:
        return `Recordatorio: tu reserva de "${serviceName}" en ${businessName} es en 24 horas (${startTime}).`;
      case NotificationType.REMINDER_1H:
        return `Recordatorio: tu reserva de "${serviceName}" en ${businessName} es en 1 hora (${startTime}).`;
      case NotificationType.CANCELLATION:
        return `Una reserva de "${serviceName}" para el ${startTime} fue cancelada.`;
    }
  }
}
