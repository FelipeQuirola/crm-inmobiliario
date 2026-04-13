import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateLossReasonDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class UpdateLossReasonDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
