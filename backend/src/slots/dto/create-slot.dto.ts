import { IsDateString, IsInt, IsOptional, IsPositive, IsUUID } from 'class-validator';

export class CreateSlotDto {
  @IsUUID()
  businessId: string;

  @IsUUID()
  serviceId: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  capacity?: number;
}
