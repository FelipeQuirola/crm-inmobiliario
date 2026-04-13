import { PartialType } from '@nestjs/mapped-types';
import { CreateStageDto } from './create-stage.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateStageDto extends PartialType(CreateStageDto) {
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
