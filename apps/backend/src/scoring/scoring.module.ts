import { Module } from '@nestjs/common';
import { ScoringService } from './scoring.service';
import { ScoringLeadsController, ScoringInsightsController } from './scoring.controller';
import { GeminiService } from './gemini.service';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ScoringLeadsController, ScoringInsightsController],
  providers: [ScoringService, GeminiService],
  exports: [ScoringService],
})
export class ScoringModule {}
