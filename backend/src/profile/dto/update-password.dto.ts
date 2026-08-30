import { IsNotEmpty, MinLength } from 'class-validator';

export class UpdatePasswordDto {
  @IsNotEmpty({ message: 'Your current password is required.' })
  currentPassword: string;

  @MinLength(6, { message: 'The new password must be at least 6 characters.' })
  newPassword: string;
}
