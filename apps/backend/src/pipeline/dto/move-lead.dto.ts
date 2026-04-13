import { Transform } from 'class-transformer';
import { IsUUID, ValidateIf } from 'class-validator';

export class MoveLeadDto {
  @Transform(({ value }) => (value === '' ? null : value))
  @ValidateIf((o: MoveLeadDto) => o.stageId !== null)
  @IsUUID()
  stageId!: string | null;
}
