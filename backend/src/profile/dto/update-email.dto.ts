import { IsEmail, IsNotEmpty } from 'class-validator';

export class UpdateEmailDto {
  @IsEmail({}, { message: 'Invalid email format.' })
  newEmail: string;

  @IsNotEmpty({ message: 'Your current password is required.' })
  currentPassword: string;
}
