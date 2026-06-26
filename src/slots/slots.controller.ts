import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { SlotsService } from './slots.service';
import { CreateSlotDto } from './dto/create-slot.dto';
import { UpdateSlotDto } from './dto/update-slot.dto';
import { ListSlotsQueryDto } from './dto/list-slots-query.dto';

@Controller('slots')
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Roles(UserRole.BUSINESS_OWNER)
  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateSlotDto) {
    return this.slotsService.create(user.sub, dto);
  }

  @Public()
  @Get('business/:businessId')
  findAvailableByBusiness(
    @Param('businessId') businessId: string,
    @Query() query: ListSlotsQueryDto,
  ) {
    return this.slotsService.findAvailableByBusiness(businessId, query);
  }

  @Roles(UserRole.BUSINESS_OWNER)
  @Get('business/:businessId/manage')
  findAllByBusiness(
    @CurrentUser() user: JwtPayload,
    @Param('businessId') businessId: string,
  ) {
    return this.slotsService.findAllByBusiness(businessId, user.sub);
  }

  @Roles(UserRole.BUSINESS_OWNER)
  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateSlotDto,
  ) {
    return this.slotsService.update(id, user.sub, dto);
  }

  @Roles(UserRole.BUSINESS_OWNER)
  @Post(':id/block')
  block(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.slotsService.block(id, user.sub);
  }

  @Roles(UserRole.BUSINESS_OWNER)
  @Post(':id/unblock')
  unblock(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.slotsService.unblock(id, user.sub);
  }

  @Roles(UserRole.BUSINESS_OWNER)
  @Delete(':id')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.slotsService.remove(id, user.sub);
  }
}
