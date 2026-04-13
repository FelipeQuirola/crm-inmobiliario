import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PropertyStatus } from '@prisma/client';

export class ChangePropertyStatusDto {
  @ApiProperty({ enum: PropertyStatus })
  @IsEnum(PropertyStatus)
  status: PropertyStatus;
}
