import { Module } from '@nestjs/common';
import { PipelineController } from './pipeline.controller';
import { PipelineService } from './pipeline.service';
import { ScoringModule } from '@/scoring/scoring.module';

@Module({
  imports: [ScoringModule],
  controllers: [PipelineController],
  providers: [PipelineService],
})
export class PipelineModule {}
