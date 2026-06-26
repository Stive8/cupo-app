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
import { BusinessesService } from './businesses.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { SearchBusinessesQueryDto } from './dto/search-businesses-query.dto';

@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Roles(UserRole.BUSINESS_OWNER)
  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateBusinessDto) {
    return this.businessesService.create(user.sub, dto);
  }

  @Public()
  @Get()
  search(@Query() query: SearchBusinessesQueryDto) {
    return this.businessesService.findAllPublic(query.city);
  }

  @Roles(UserRole.BUSINESS_OWNER)
  @Get('me')
  findMine(@CurrentUser() user: JwtPayload) {
    return this.businessesService.findAllByOwner(user.sub);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.businessesService.findOnePublic(id);
  }

  @Roles(UserRole.BUSINESS_OWNER)
  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateBusinessDto,
  ) {
    return this.businessesService.update(id, user.sub, dto);
  }

  @Roles(UserRole.BUSINESS_OWNER)
  @Post(':id/publish')
  publish(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.businessesService.publish(id, user.sub);
  }

  @Roles(UserRole.BUSINESS_OWNER)
  @Delete(':id')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.businessesService.remove(id, user.sub);
  }
}
