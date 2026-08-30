import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Invalid email format.' })
  email: string;

  @MinLength(6, { message: 'Password must be at least 6 characters.' })
  password: string;

  /** UI language at sign-up — decides which starter categories get seeded. */
  @IsOptional()
  @IsString()
  locale?: string;
}
