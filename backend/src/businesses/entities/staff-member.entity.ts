import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Business } from './business.entity';

/**
 * No se usa en ningún flujo del MVP (vertical sports_field).
 * Obligatorio a partir de V2 (vertical barbershop).
 */
@Entity('staff_members')
export class StaffMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id', type: 'uuid' })
  businessId: string;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column()
  name: string;

  @Column({ type: 'varchar', nullable: true })
  role: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
