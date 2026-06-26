import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessesService } from '../businesses/businesses.service';
import { Service } from './entities/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly servicesRepository: Repository<Service>,
    private readonly businessesService: BusinessesService,
  ) {}

  async create(ownerId: string, dto: CreateServiceDto): Promise<Service> {
    await this.businessesService.findOneOwned(dto.businessId, ownerId);
    const service = this.servicesRepository.create(dto);
    return this.servicesRepository.save(service);
  }

  findAllByBusiness(businessId: string): Promise<Service[]> {
    return this.servicesRepository.find({ where: { businessId, isActive: true } });
  }

  private async findOneOwned(id: string, ownerId: string): Promise<Service> {
    const service = await this.servicesRepository.findOne({ where: { id } });
    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }
    await this.businessesService.findOneOwned(service.businessId, ownerId);
    return service;
  }

  async update(id: string, ownerId: string, dto: UpdateServiceDto): Promise<Service> {
    const service = await this.findOneOwned(id, ownerId);
    Object.assign(service, dto);
    return this.servicesRepository.save(service);
  }

  async remove(id: string, ownerId: string): Promise<void> {
    const service = await this.findOneOwned(id, ownerId);
    await this.servicesRepository.softRemove(service);
  }
}
