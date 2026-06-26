import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import type { WompiEvent } from './interfaces/wompi-event.interface';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Roles(UserRole.CUSTOMER)
  @Post()
  initiate(@CurrentUser() user: JwtPayload, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.initiate(user.sub, dto);
  }

  @Roles(UserRole.CUSTOMER, UserRole.BUSINESS_OWNER)
  @Get('booking/:bookingId')
  findByBooking(@CurrentUser() user: JwtPayload, @Param('bookingId') bookingId: string) {
    return this.paymentsService.findOneByBooking(bookingId, user);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('webhook')
  async webhook(@Body() event: WompiEvent) {
    await this.paymentsService.handleWebhook(event);
    return { received: true };
  }
}
