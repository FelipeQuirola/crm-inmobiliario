import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { LeadsModule } from './leads/leads.module';
import { UsersModule } from './users/users.module';
import { PipelineModule } from './pipeline/pipeline.module';
import { ActivitiesModule } from './activities/activities.module';
import { PropertiesModule } from './properties/properties.module';
import { CalendarModule } from './calendar/calendar.module';
import { ReportsModule } from './reports/reports.module';
import { CommunicationsModule } from './communications/communications.module';
import { PublicModule } from './public/public.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RemindersModule } from './reminders/reminders.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { LossReasonsModule } from './loss-reasons/loss-reasons.module';
import { ScoringModule } from './scoring/scoring.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get<string>('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    LeadsModule,
    UsersModule,
    PipelineModule,
    ActivitiesModule,
    PropertiesModule,
    CalendarModule,
    ReportsModule,
    CommunicationsModule,
    PublicModule,
    NotificationsModule,
    RemindersModule,
    WebhooksModule,
    LossReasonsModule,
    ScoringModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(TenantMiddleware)
      .forRoutes({ path: 'api/*', method: RequestMethod.ALL });
  }
}
