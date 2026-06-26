import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateSlotDto } from './create-slot.dto';

export class UpdateSlotDto extends PartialType(
  OmitType(CreateSlotDto, ['businessId', 'serviceId'] as const),
) {}
