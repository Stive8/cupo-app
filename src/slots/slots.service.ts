import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { BusinessesService } from '../businesses/businesses.service';
import { ServicesService } from '../services/services.service';
import { AvailabilitySlot, SlotStatus } from './entities/availability-slot.entity';
import { CreateSlotDto } from './dto/create-slot.dto';
import { UpdateSlotDto } from './dto/update-slot.dto';
import { ListSlotsQueryDto } from './dto/list-slots-query.dto';

@Injectable()
export class SlotsService {
  constructor(
    @InjectRepository(AvailabilitySlot)
    private readonly slotsRepository: Repository<AvailabilitySlot>,
    private readonly businessesService: BusinessesService,
    private readonly servicesService: ServicesService,
  ) {}

  async create(ownerId: string, dto: CreateSlotDto): Promise<AvailabilitySlot> {
    await this.businessesService.findOneOwned(dto.businessId, ownerId);
    await this.servicesService.findOneByBusiness(dto.serviceId, dto.businessId);

    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);
    if (endTime <= startTime) {
      throw new BadRequestException('endTime debe ser posterior a startTime');
    }

    const slot = this.slotsRepository.create({
      businessId: dto.businessId,
      serviceId: dto.serviceId,
      staffMemberId: null,
      startTime,
      endTime,
      capacity: dto.capacity ?? 1,
      status: SlotStatus.AVAILABLE,
      bookedCount: 0,
    });
    return this.slotsRepository.save(slot);
  }

  findAvailableByBusiness(
    businessId: string,
    query: ListSlotsQueryDto,
  ): Promise<AvailabilitySlot[]> {
    const where: Record<string, unknown> = {
      businessId,
      status: SlotStatus.AVAILABLE,
    };

    if (query.from && query.to) {
      where.startTime = Between(new Date(query.from), new Date(query.to));
    } else if (query.from) {
      where.startTime = MoreThanOrEqual(new Date(query.from));
    } else if (query.to) {
      where.startTime = LessThanOrEqual(new Date(query.to));
    }

    return this.slotsRepository.find({ where, order: { startTime: 'ASC' } });
  }

  private async findOneOwned(id: string, ownerId: string): Promise<AvailabilitySlot> {
    const slot = await this.slotsRepository.findOne({ where: { id } });
    if (!slot) {
      throw new NotFoundException('Slot no encontrado');
    }
    await this.businessesService.findOneOwned(slot.businessId, ownerId);
    return slot;
  }

  async update(id: string, ownerId: string, dto: UpdateSlotDto): Promise<AvailabilitySlot> {
    const slot = await this.findOneOwned(id, ownerId);
    if (slot.status !== SlotStatus.AVAILABLE) {
      throw new ConflictException('Solo se pueden editar slots disponibles');
    }

    const startTime = dto.startTime ? new Date(dto.startTime) : slot.startTime;
    const endTime = dto.endTime ? new Date(dto.endTime) : slot.endTime;
    if (endTime <= startTime) {
      throw new BadRequestException('endTime debe ser posterior a startTime');
    }

    slot.startTime = startTime;
    slot.endTime = endTime;
    if (dto.capacity !== undefined) {
      slot.capacity = dto.capacity;
    }
    return this.slotsRepository.save(slot);
  }

  async block(id: string, ownerId: string): Promise<AvailabilitySlot> {
    const slot = await this.findOneOwned(id, ownerId);
    if (slot.status !== SlotStatus.AVAILABLE) {
      throw new ConflictException('Solo se pueden bloquear slots disponibles');
    }
    slot.status = SlotStatus.BLOCKED;
    return this.slotsRepository.save(slot);
  }

  async unblock(id: string, ownerId: string): Promise<AvailabilitySlot> {
    const slot = await this.findOneOwned(id, ownerId);
    if (slot.status !== SlotStatus.BLOCKED) {
      throw new ConflictException('Solo se pueden desbloquear slots bloqueados');
    }
    slot.status = SlotStatus.AVAILABLE;
    return this.slotsRepository.save(slot);
  }

  async remove(id: string, ownerId: string): Promise<void> {
    const slot = await this.findOneOwned(id, ownerId);
    if (slot.status !== SlotStatus.AVAILABLE) {
      throw new ConflictException('Solo se pueden eliminar slots disponibles');
    }
    await this.slotsRepository.remove(slot);
  }
}
