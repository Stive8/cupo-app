import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Business } from '../businesses/entities/business.entity';
import { Service } from '../services/entities/service.entity';
import { AvailabilitySlot, SlotStatus } from '../slots/entities/availability-slot.entity';
import { BusinessesService } from '../businesses/businesses.service';
import { Booking, BookingStatus } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';

const CANCELLATION_WINDOW_HOURS = 24;

@Injectable()
export class BookingsService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    private readonly businessesService: BusinessesService,
  ) {}

  create(userId: string, dto: CreateBookingDto): Promise<Booking> {
    return this.dataSource.transaction(async (manager) => {
      const slot = await manager.findOne(AvailabilitySlot, {
        where: { id: dto.slotId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!slot) {
        throw new NotFoundException('Slot no encontrado');
      }
      if (slot.status !== SlotStatus.AVAILABLE || slot.bookedCount >= slot.capacity) {
        throw new ConflictException('Slot no disponible');
      }

      const service = await manager.findOne(Service, { where: { id: slot.serviceId } });
      if (!service) {
        throw new NotFoundException('Servicio no encontrado');
      }

      const business = await manager.findOne(Business, { where: { id: slot.businessId } });
      if (!business) {
        throw new NotFoundException('Negocio no encontrado');
      }

      const totalCents = service.priceCents;
      const depositCents = Math.round((totalCents * business.depositPercentage) / 100);

      const booking = manager.create(Booking, {
        userId,
        businessId: slot.businessId,
        slotId: slot.id,
        serviceId: slot.serviceId,
        status: BookingStatus.PENDING,
        totalCents,
        depositCents,
        notes: dto.notes ?? null,
      });
      await manager.save(booking);

      slot.bookedCount += 1;
      if (slot.bookedCount >= slot.capacity) {
        slot.status = SlotStatus.BOOKED;
      }
      await manager.save(slot);

      return booking;
    });
  }

  async findById(id: string): Promise<Booking> {
    const booking = await this.bookingsRepository.findOne({ where: { id } });
    if (!booking) {
      throw new NotFoundException('Reserva no encontrada');
    }
    return booking;
  }

  async findOneOwned(id: string, userId: string): Promise<Booking> {
    const booking = await this.findById(id);
    if (booking.userId !== userId) {
      throw new ForbiddenException('No tienes acceso a esta reserva');
    }
    return booking;
  }

  findAllByUser(userId: string): Promise<Booking[]> {
    return this.bookingsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findAllByBusiness(businessId: string, ownerId: string): Promise<Booking[]> {
    await this.businessesService.findOneOwned(businessId, ownerId);
    return this.bookingsRepository.find({
      where: { businessId },
      order: { createdAt: 'DESC' },
    });
  }

  cancel(id: string, userId: string): Promise<Booking> {
    return this.dataSource.transaction(async (manager) => {
      const booking = await manager.findOne(Booking, { where: { id } });
      if (!booking) {
        throw new NotFoundException('Reserva no encontrada');
      }
      if (booking.userId !== userId) {
        throw new ForbiddenException('No tienes acceso a esta reserva');
      }
      if (
        booking.status !== BookingStatus.PENDING &&
        booking.status !== BookingStatus.CONFIRMED
      ) {
        throw new ConflictException('Esta reserva no se puede cancelar');
      }

      const slot = await manager.findOne(AvailabilitySlot, {
        where: { id: booking.slotId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!slot) {
        throw new NotFoundException('Slot no encontrado');
      }

      const cutoff = new Date(
        slot.startTime.getTime() - CANCELLATION_WINDOW_HOURS * 60 * 60 * 1000,
      );
      if (new Date() > cutoff) {
        throw new BadRequestException(
          `Solo se puede cancelar hasta ${CANCELLATION_WINDOW_HOURS}h antes del inicio`,
        );
      }

      booking.status = BookingStatus.CANCELLED;
      booking.cancelledAt = new Date();
      await manager.save(booking);

      slot.bookedCount = Math.max(0, slot.bookedCount - 1);
      slot.status = SlotStatus.AVAILABLE;
      await manager.save(slot);

      return booking;
    });
  }
}
