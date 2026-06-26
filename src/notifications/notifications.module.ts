import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { User } from '../users/entities/user.entity';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, Booking, User])],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
