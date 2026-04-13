import { Transform } from 'class-transformer';
import { IsUUID, ValidateIf } from 'class-validator';

export class AssignLeadDto {
  @Transform(({ value }) => (value === '' ? null : value))
  @ValidateIf((o: AssignLeadDto) => o.assignedToId !== null)
  @IsUUID()
  assignedToId!: string | null;
}
