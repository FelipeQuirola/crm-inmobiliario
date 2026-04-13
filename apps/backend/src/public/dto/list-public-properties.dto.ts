import { IsOptional, IsString, IsEnum, IsNumber, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PropertyType } from '@prisma/client';

export class ListPublicPropertiesDto {
  @IsOptional()
  @IsString()
  slug: string;

  @IsOptional()
  @IsEnum(PropertyType)
  type?: PropertyType;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  sector?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bedroomsMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  take?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;
}
