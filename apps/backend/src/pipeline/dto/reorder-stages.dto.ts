import { IsArray, IsString } from 'class-validator';

export class ReorderStagesDto {
  @IsArray()
  @IsString({ each: true })
  orderedIds: string[];
}
