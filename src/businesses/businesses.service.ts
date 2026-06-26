import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business, BusinessStatus, BusinessVertical } from './entities/business.entity';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Injectable()
export class BusinessesService {
  constructor(
    @InjectRepository(Business)
    private readonly businessesRepository: Repository<Business>,
  ) {}

  create(ownerId: string, dto: CreateBusinessDto): Promise<Business> {
    const business = this.businessesRepository.create({
      ...dto,
      ownerId,
      vertical: BusinessVertical.SPORTS_FIELD,
      status: BusinessStatus.PENDING,
    });
    return this.businessesRepository.save(business);
  }

  findAllByOwner(ownerId: string): Promise<Business[]> {
    return this.businessesRepository.find({ where: { ownerId } });
  }

  async findOnePublic(id: string): Promise<Business> {
    const business = await this.businessesRepository.findOne({
      where: { id, status: BusinessStatus.ACTIVE },
    });
    if (!business) {
      throw new NotFoundException('Negocio no encontrado');
    }
    return business;
  }

  async findOneOwned(id: string, ownerId: string): Promise<Business> {
    const business = await this.businessesRepository.findOne({ where: { id } });
    if (!business) {
      throw new NotFoundException('Negocio no encontrado');
    }
    if (business.ownerId !== ownerId) {
      throw new ForbiddenException('No tienes acceso a este negocio');
    }
    return business;
  }

  async update(id: string, ownerId: string, dto: UpdateBusinessDto): Promise<Business> {
    const business = await this.findOneOwned(id, ownerId);
    Object.assign(business, dto);
    return this.businessesRepository.save(business);
  }

  async publish(id: string, ownerId: string): Promise<Business> {
    const business = await this.findOneOwned(id, ownerId);
    business.status = BusinessStatus.ACTIVE;
    return this.businessesRepository.save(business);
  }

  async remove(id: string, ownerId: string): Promise<void> {
    const business = await this.findOneOwned(id, ownerId);
    await this.businessesRepository.softRemove(business);
  }
}
