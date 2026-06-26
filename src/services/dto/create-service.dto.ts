import { IsInt, IsOptional, IsPositive, IsString, IsUUID, Length } from 'class-validator';

export class CreateServiceDto {
  @IsUUID()
  businessId: string;

  @IsString()
  name: string;

  @IsInt()
  @IsPositive()
  durationMinutes: number;

  @IsInt()
  @IsPositive()
  priceCents: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;
}
