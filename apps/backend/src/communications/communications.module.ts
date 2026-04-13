import { Module } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';

@Module({
  controllers: [TemplatesController, MessagesController],
  providers:   [TemplatesService, MessagesService],
})
export class CommunicationsModule {}
