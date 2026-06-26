import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessesModule } from '../businesses/businesses.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { Booking } from './entities/booking.entity';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Booking]), BusinessesModule, NotificationsModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
