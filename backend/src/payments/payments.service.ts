import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { createHash, randomUUID, timingSafeEqual } from 'crypto';
import { DataSource, In, Repository } from 'typeorm';
import { BookingsService } from '../bookings/bookings.service';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { BusinessesService } from '../businesses/businesses.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AvailabilitySlot, SlotStatus } from '../slots/entities/availability-slot.entity';
import { UserRole } from '../users/entities/user.entity';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { WompiEvent } from './interfaces/wompi-event.interface';

const CURRENCY = 'COP';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly config: ConfigService,
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    private readonly bookingsService: BookingsService,
    private readonly businessesService: BusinessesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async initiate(userId: string, dto: CreatePaymentDto) {
    const booking = await this.bookingsService.findOneOwned(dto.bookingId, userId);
    if (booking.status !== BookingStatus.PENDING) {
      throw new ConflictException('Esta reserva no admite un nuevo pago');
    }

    const existing = await this.paymentsRepository.findOne({
      where: { bookingId: booking.id, status: In([PaymentStatus.PENDING, PaymentStatus.APPROVED]) },
    });
    if (existing?.status === PaymentStatus.APPROVED) {
      throw new ConflictException('Esta reserva ya tiene un pago aprobado');
    }
    if (existing) {
      // Pago pendiente: se reenvían los mismos datos (mismo reference) en vez de
      // crear uno nuevo, para que el cliente pueda recargar la página de pago.
      return {
        paymentId: existing.id,
        reference: existing.reference,
        amountCents: existing.amountCents,
        currency: existing.currency,
        publicKey: this.config.get<string>('WOMPI_PUBLIC_KEY'),
        integritySignature: this.buildIntegritySignature(existing.reference, existing.amountCents),
      };
    }

    const reference = randomUUID();
    const amountCents = booking.depositCents;

    const payment = this.paymentsRepository.create({
      bookingId: booking.id,
      provider: 'wompi',
      reference,
      providerReference: null,
      amountCents,
      currency: CURRENCY,
      status: PaymentStatus.PENDING,
    });
    await this.paymentsRepository.save(payment);

    return {
      paymentId: payment.id,
      reference,
      amountCents,
      currency: CURRENCY,
      publicKey: this.config.get<string>('WOMPI_PUBLIC_KEY'),
      integritySignature: this.buildIntegritySignature(reference, amountCents),
    };
  }

  async findOneByBooking(bookingId: string, user: JwtPayload): Promise<Payment | null> {
    const booking = await this.bookingsService.findById(bookingId);

    if (user.role === UserRole.CUSTOMER) {
      if (booking.userId !== user.sub) {
        throw new ForbiddenException('No tienes acceso a esta reserva');
      }
    } else {
      await this.businessesService.findOneOwned(booking.businessId, user.sub);
    }

    return this.paymentsRepository.findOne({
      where: { bookingId },
      order: { createdAt: 'DESC' },
    });
  }

  async handleWebhook(event: WompiEvent): Promise<void> {
    if (!this.isSignatureValid(event)) {
      throw new UnauthorizedException('Firma de webhook inválida');
    }

    const { transaction } = event.data;

    const result = await this.dataSource.transaction(async (manager) => {
      const payment = await manager.findOne(Payment, {
        where: { reference: transaction.reference },
        lock: { mode: 'pessimistic_write' },
      });
      if (!payment) {
        throw new NotFoundException('Pago no encontrado');
      }
      if (payment.status !== PaymentStatus.PENDING) {
        return { outcome: 'noop' as const };
      }

      if (transaction.status === 'PENDING') {
        payment.providerReference = transaction.id;
        await manager.save(payment);
        return { outcome: 'noop' as const };
      }

      const booking = await manager.findOne(Booking, {
        where: { id: payment.bookingId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!booking) {
        throw new NotFoundException('Reserva no encontrada');
      }

      payment.providerReference = transaction.id;

      if (transaction.status === 'APPROVED') {
        payment.status = PaymentStatus.APPROVED;
        booking.status = BookingStatus.CONFIRMED;
        await manager.save(payment);
        await manager.save(booking);

        const slot = await manager.findOne(AvailabilitySlot, { where: { id: booking.slotId } });
        return { outcome: 'approved' as const, booking, slotStartTime: slot?.startTime };
      }

      payment.status = PaymentStatus.REJECTED;
      booking.status = BookingStatus.CANCELLED;
      booking.cancelledAt = new Date();
      await manager.save(payment);
      await manager.save(booking);

      const slot = await manager.findOne(AvailabilitySlot, {
        where: { id: booking.slotId },
        lock: { mode: 'pessimistic_write' },
      });
      if (slot) {
        slot.bookedCount = Math.max(0, slot.bookedCount - 1);
        slot.status = SlotStatus.AVAILABLE;
        await manager.save(slot);
      }

      return { outcome: 'rejected' as const, booking };
    });

    if (result.outcome === 'approved' && result.slotStartTime) {
      await this.notificationsService.scheduleBookingConfirmed(
        result.booking.userId,
        result.booking.id,
        result.slotStartTime,
      );
    } else if (result.outcome === 'rejected') {
      const business = await this.businessesService.findById(result.booking.businessId);
      await this.notificationsService.scheduleBookingCancelled(business.ownerId, result.booking.id);
    }
  }

  private buildIntegritySignature(reference: string, amountCents: number): string {
    const secret = this.config.get<string>('WOMPI_INTEGRITY_SECRET') ?? '';
    return createHash('sha256')
      .update(`${reference}${amountCents}${CURRENCY}${secret}`)
      .digest('hex');
  }

  private isSignatureValid(event: WompiEvent): boolean {
    const secret = this.config.get<string>('WOMPI_EVENTS_SECRET') ?? '';
    const data = event.data as unknown as Record<string, unknown>;

    const concatenatedValues = event.signature.properties
      .map((path) => this.readPath(data, path))
      .join('');

    const expected = createHash('sha256')
      .update(`${concatenatedValues}${event.timestamp}${secret}`)
      .digest('hex');

    const received = event.signature.checksum;
    if (expected.length !== received.length) {
      return false;
    }
    return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
  }

  private readPath(source: Record<string, unknown>, path: string): string {
    const value = path
      .split('.')
      .reduce<unknown>((acc, key) => (acc as Record<string, unknown>)?.[key], source);
    return String(value ?? '');
  }
}
