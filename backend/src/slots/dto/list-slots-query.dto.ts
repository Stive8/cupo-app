import { IsDateString, IsOptional } from 'class-validator';

export class ListSlotsQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
