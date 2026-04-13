import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { RemindersProcessor } from './reminders.processor';
import { RemindersScheduler } from './reminders.scheduler';
import { NotificationsModule } from '@/notifications/notifications.module';
import { ScoringModule } from '@/scoring/scoring.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'reminders' }),
    NotificationsModule,
    ScoringModule,
  ],
  providers: [RemindersProcessor, RemindersScheduler],
})
export class RemindersModule {}
