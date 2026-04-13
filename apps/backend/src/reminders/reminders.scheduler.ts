import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import {
  CHECK_INACTIVE_JOB,
  CHECK_OVERDUE_JOB,
  CHECK_MEETINGS_JOB,
} from './reminders.processor';
import { ScoringService } from '@/scoring/scoring.service';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class RemindersScheduler {
  private readonly logger = new Logger(RemindersScheduler.name);

  constructor(
    @InjectQueue('reminders') private readonly remindersQueue: Queue,
    private readonly scoringService: ScoringService,
    private readonly prisma: PrismaService,
  ) {}

  // Every hour — check inactive leads + overdue actions
  @Cron('0 * * * *')
  async scheduleHourlyJobs(): Promise<void> {
    this.logger.log('Scheduling hourly reminder jobs');
    await this.remindersQueue.add(CHECK_INACTIVE_JOB, {});
    await this.remindersQueue.add(CHECK_OVERDUE_JOB, {});
  }

  // Every 30 minutes — check upcoming meetings
  @Cron('*/30 * * * *')
  async scheduleMeetingReminders(): Promise<void> {
    this.logger.log('Scheduling meeting reminder job');
    await this.remindersQueue.add(CHECK_MEETINGS_JOB, {});
  }

  // At 2am daily — recalculate scores for all active leads per tenant
  @Cron('0 2 * * *')
  async scheduleDailyScoreRecalculation(): Promise<void> {
    this.logger.log('Starting daily lead score recalculation');
    try {
      const tenants = await this.prisma.tenant.findMany({
        where: { isActive: true },
        select: { id: true },
      });

      for (const tenant of tenants) {
        this.logger.log(`Recalculating scores for tenant ${tenant.id}`);
        await this.scoringService.recalculateAllActive(tenant.id);
      }

      this.logger.log('Daily lead score recalculation completed');
    } catch (err) {
      this.logger.error('Daily score recalculation failed', (err as Error).message);
    }
  }
}
