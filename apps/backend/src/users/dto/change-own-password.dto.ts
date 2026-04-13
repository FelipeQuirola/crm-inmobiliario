import { IsString, MinLength } from 'class-validator';

export class ChangeOwnPasswordDto {
  @IsString()
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;

  @IsString()
  confirmPassword!: string;
}
