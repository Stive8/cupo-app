import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Roles(UserRole.BUSINESS_OWNER)
  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateServiceDto) {
    return this.servicesService.create(user.sub, dto);
  }

  @Public()
  @Get('business/:businessId')
  findAllByBusiness(@Param('businessId') businessId: string) {
    return this.servicesService.findAllByBusiness(businessId);
  }

  @Roles(UserRole.BUSINESS_OWNER)
  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(id, user.sub, dto);
  }

  @Roles(UserRole.BUSINESS_OWNER)
  @Delete(':id')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.servicesService.remove(id, user.sub);
  }
}
