import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max, IsHexColor } from 'class-validator';

export class CreateStageDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  probability?: number;

  @IsOptional()
  @IsString()
  description?: string;
}
