import { IsEmail, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Invalid email format.' })
  email: string;

  @MinLength(6, { message: 'Password must be at least 6 characters.' })
  password: string;
}
