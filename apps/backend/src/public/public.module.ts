import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { ContactRateLimitGuard } from './guards/contact-rate-limit.guard';

@Module({
  controllers: [PublicController],
  providers: [PublicService, ContactRateLimitGuard],
})
export class PublicModule {}
