import { Module } from '@nestjs/common';
import { LossReasonsController } from './loss-reasons.controller';
import { LossReasonsService } from './loss-reasons.service';

@Module({
  controllers: [LossReasonsController],
  providers: [LossReasonsService],
  exports: [LossReasonsService],
})
export class LossReasonsModule {}
