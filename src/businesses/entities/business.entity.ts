import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum BusinessVertical {
  SPORTS_FIELD = 'sports_field',
  BARBERSHOP = 'barbershop',
  BEAUTY_CENTER = 'beauty_center',
  PROFESSIONAL = 'professional',
}

export enum BusinessStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

@Entity('businesses')
export class Business {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: BusinessVertical })
  vertical: BusinessVertical;

  @Column({ type: 'varchar', nullable: true })
  description: string | null;

  @Column()
  address: string;

  @Column()
  city: string;

  @Column({ type: 'float', nullable: true })
  lat: number | null;

  @Column({ type: 'float', nullable: true })
  lng: number | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'enum', enum: BusinessStatus, default: BusinessStatus.PENDING })
  status: BusinessStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}
