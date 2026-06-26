import { IsOptional, IsString } from 'class-validator';

export class SearchBusinessesQueryDto {
  @IsOptional()
  @IsString()
  city?: string;
}
