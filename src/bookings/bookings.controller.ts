import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Roles(UserRole.CUSTOMER)
  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(user.sub, dto);
  }

  @Roles(UserRole.CUSTOMER)
  @Get('me')
  findMine(@CurrentUser() user: JwtPayload) {
    return this.bookingsService.findAllByUser(user.sub);
  }

  @Roles(UserRole.BUSINESS_OWNER)
  @Get('business/:businessId')
  findByBusiness(
    @CurrentUser() user: JwtPayload,
    @Param('businessId') businessId: string,
  ) {
    return this.bookingsService.findAllByBusiness(businessId, user.sub);
  }

  @Roles(UserRole.CUSTOMER)
  @Post(':id/cancel')
  cancel(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.bookingsService.cancel(id, user.sub);
  }
}
