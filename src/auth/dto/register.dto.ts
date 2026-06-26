import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class RegisterDto {
  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;

  @IsString()
  fullName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsIn([UserRole.CUSTOMER, UserRole.BUSINESS_OWNER])
  role: UserRole;
}
