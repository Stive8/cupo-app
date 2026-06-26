import {
  IsLatitude,
  IsLongitude,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateBusinessDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsOptional()
  @IsLatitude()
  lat?: number;

  @IsOptional()
  @IsLongitude()
  lng?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
