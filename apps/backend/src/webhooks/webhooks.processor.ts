import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { WebhooksService, PROCESS_FACEBOOK_JOB, FacebookJobData } from './webhooks.service';

@Processor('webhooks')
export class WebhooksProcessor {
  private readonly logger = new Logger(WebhooksProcessor.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  @Process(PROCESS_FACEBOOK_JOB)
  async processFacebookLead(job: Job<FacebookJobData>): Promise<void> {
    this.logger.log(`Processing Facebook lead job: ${job.data.leadgenId}`);
    await this.webhooksService.processFacebookLead(job.data);
  }
}
