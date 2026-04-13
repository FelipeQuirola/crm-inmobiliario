import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '@/prisma/prisma.service';
import { LeadSource, WebhookProvider, WebhookStatus } from '@prisma/client';
import { normalizePhone, computeDuplicateHash } from '@/leads/helpers/lead.helpers';
import type { GoogleWebhookBody, GoogleUserColumnData } from './dto/google-webhook.dto';
import type { FacebookLeadData } from './dto/facebook-webhook.dto';
import type { GenericWebhookDto } from './dto/generic-webhook.dto';
import type { ListWebhookEventsDto } from './dto/list-webhook-events.dto';
import * as https from 'https';
import { randomUUID } from 'crypto';

export const PROCESS_FACEBOOK_JOB = 'process-facebook-lead';

export interface FacebookJobData {
  leadgenId: string;
  pageId: string;
  providerEventId: string;
  rawPayload: unknown;
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @InjectQueue('webhooks') private readonly webhooksQueue: Queue,
  ) {}

  // ─── Facebook GET verification ────────────────────────────────────────────

  verifyFacebook(mode: string, token: string, challenge: string): string {
    const verifyToken = this.config.get<string>('FACEBOOK_WEBHOOK_VERIFY_TOKEN', '');
    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('Facebook webhook verified successfully');
      return challenge;
    }
    throw new ForbiddenException('Facebook webhook verification failed');
  }

  // ─── Facebook POST — enqueue async processing ─────────────────────────────

  async enqueueFacebookWebhook(body: unknown): Promise<void> {
    const payload = body as {
      object?: string;
      entry?: Array<{
        id?: string;
        changes?: Array<{
          field?: string;
          value?: {
            leadgen_id?: string;
            page_id?: string;
            form_id?: string;
          };
        }>;
      }>;
    };

    if (payload.object !== 'page' || !Array.isArray(payload.entry)) {
      this.logger.warn('Unexpected Facebook webhook payload structure');
      return;
    }

    for (const entry of payload.entry) {
      for (const change of entry.changes ?? []) {
        if (change.field !== 'leadgen') continue;
        const val = change.value;
        if (!val?.leadgen_id || !val.page_id) continue;

        await this.webhooksQueue.add(
          PROCESS_FACEBOOK_JOB,
          {
            leadgenId: val.leadgen_id,
            pageId: val.page_id,
            providerEventId: val.leadgen_id,
            rawPayload: body,
          } satisfies FacebookJobData,
          { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
        );

        this.logger.log(`Enqueued Facebook lead job: leadgen_id=${val.leadgen_id}`);
      }
    }
  }

  // ─── Process Facebook lead (called from processor) ────────────────────────

  async processFacebookLead(data: FacebookJobData): Promise<void> {
    const { leadgenId, pageId, providerEventId, rawPayload } = data;

    // 1. Idempotency check
    const existing = await this.prisma.webhookEvent.findUnique({
      where: {
        providerEventId_provider: {
          providerEventId,
          provider: WebhookProvider.FACEBOOK,
        },
      },
    });

    if (existing && existing.status !== WebhookStatus.PENDING) {
      this.logger.log(`Duplicate Facebook event: ${providerEventId} — skipping`);
      return;
    }

    // Create or reuse event record
    const event = existing ?? (await this.prisma.webhookEvent.create({
      data: {
        provider: WebhookProvider.FACEBOOK,
        providerEventId,
        payload: rawPayload as object,
        status: WebhookStatus.PENDING,
      },
    }));

    try {
      // 2. Find page config (maps page_id → tenant + access token)
      const pageConfig = await this.prisma.facebookPageConfig.findUnique({
        where: { pageId },
      });

      const accessToken = pageConfig?.accessToken
        ?? this.config.get<string>('FACEBOOK_PAGE_ACCESS_TOKEN', '');

      if (!accessToken) {
        throw new Error(`No access token found for page_id=${pageId}`);
      }

      // 3. Fetch lead data from Facebook Graph API
      const leadData = await this.fetchFacebookLeadData(leadgenId, accessToken);

      // 4. Map field_data to lead fields
      const fields = this.mapFacebookFields(leadData.field_data);

      if (!fields.phone) {
        throw new Error('Facebook lead has no phone number');
      }

      const tenantId = pageConfig?.tenantId ?? null;
      if (!tenantId) {
        throw new Error(`No tenant configured for page_id=${pageId}`);
      }

      // 5. Create lead
      const lead = await this.createLeadFromWebhook(
        {
          firstName: fields.firstName || 'Desconocido',
          lastName: fields.lastName || '',
          phone: fields.phone,
          email: fields.email,
        },
        tenantId,
        LeadSource.FACEBOOK,
      );

      // 6. Mark event as processed
      await this.prisma.webhookEvent.update({
        where: { id: event.id },
        data: {
          status: WebhookStatus.PROCESSED,
          tenantId,
          leadId: lead?.id ?? null,
          processedAt: new Date(),
        },
      });

      this.logger.log(`Facebook lead processed: leadgen_id=${leadgenId}, lead_id=${lead?.id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to process Facebook lead ${leadgenId}: ${errorMessage}`);

      await this.prisma.webhookEvent.update({
        where: { id: event.id },
        data: {
          status: WebhookStatus.FAILED,
          errorMessage,
          processedAt: new Date(),
        },
      });

      throw err; // allow BullMQ to retry
    }
  }

  // ─── Google Ads webhook ───────────────────────────────────────────────────

  async processGoogleWebhook(
    body: GoogleWebhookBody,
    slug: string,
  ): Promise<{ status: string }> {
    const expectedKey = this.config.get<string>('GOOGLE_WEBHOOK_KEY', '');
    if (!body.google_key || body.google_key !== expectedKey) {
      throw new ForbiddenException('Invalid Google webhook key');
    }

    const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) throw new NotFoundException(`Tenant '${slug}' not found`);

    const fields = this.mapGoogleFields(body.user_column_data);
    if (!fields.phone) {
      throw new BadRequestException('Google lead has no phone number');
    }

    const providerEventId = body.submission_id ?? `google-${body.form_id}-${Date.now()}`;

    const event = await this.prisma.webhookEvent.upsert({
      where: {
        providerEventId_provider: {
          providerEventId,
          provider: WebhookProvider.GOOGLE,
        },
      },
      create: {
        provider: WebhookProvider.GOOGLE,
        providerEventId,
        payload: body as object,
        status: WebhookStatus.PENDING,
        tenantId: tenant.id,
      },
      update: {},
    });

    if (event.status === WebhookStatus.PROCESSED || event.status === WebhookStatus.DUPLICATE) {
      return { status: 'duplicate' };
    }

    try {
      const lead = await this.createLeadFromWebhook(
        {
          firstName: fields.firstName || 'Desconocido',
          lastName: fields.lastName || '',
          phone: fields.phone,
          email: fields.email,
        },
        tenant.id,
        LeadSource.GOOGLE,
      );

      await this.prisma.webhookEvent.update({
        where: { id: event.id },
        data: {
          status: WebhookStatus.PROCESSED,
          leadId: lead?.id ?? null,
          processedAt: new Date(),
        },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to process Google webhook: ${errorMessage}`);
      await this.prisma.webhookEvent.update({
        where: { id: event.id },
        data: { status: WebhookStatus.FAILED, errorMessage, processedAt: new Date() },
      });
      throw err;
    }

    return { status: 'success' };
  }

  // ─── Generic webhook ──────────────────────────────────────────────────────

  async processGenericWebhook(
    dto: GenericWebhookDto,
    secret: string,
    slug: string,
  ) {
    const expectedSecret = this.config.get<string>('GENERIC_WEBHOOK_SECRET', '');
    if (!secret || secret !== expectedSecret) {
      throw new ForbiddenException('Invalid webhook secret');
    }

    const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) throw new NotFoundException(`Tenant '${slug}' not found`);

    // 1. Register the incoming event
    const event = await this.prisma.webhookEvent.create({
      data: {
        provider: WebhookProvider.OTHER,
        providerEventId: randomUUID(),
        payload: dto as object,
        status: WebhookStatus.PENDING,
        tenantId: tenant.id,
      },
    });

    // 2. Create lead — mark FAILED if it throws
    try {
      const lead = await this.createLeadFromWebhook(
        {
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          email: dto.email,
          notes: dto.notes,
        },
        tenant.id,
        LeadSource.OTHER,
      );

      // 3. Mark processed
      await this.prisma.webhookEvent.update({
        where: { id: event.id },
        data: {
          status: WebhookStatus.PROCESSED,
          leadId: lead?.id ?? null,
          processedAt: new Date(),
        },
      });

      return lead;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to process generic webhook: ${errorMessage}`);
      await this.prisma.webhookEvent.update({
        where: { id: event.id },
        data: { status: WebhookStatus.FAILED, errorMessage, processedAt: new Date() },
      });
      throw err;
    }
  }

  // ─── List events (admin) ──────────────────────────────────────────────────

  async listEvents(tenantId: string, dto: ListWebhookEventsDto) {
    const where = {
      tenantId,
      ...(dto.provider ? { provider: dto.provider } : {}),
      ...(dto.status ? { status: dto.status } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.webhookEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: dto.limit ?? 50,
        skip: dto.offset ?? 0,
        select: {
          id: true,
          provider: true,
          status: true,
          providerEventId: true,
          errorMessage: true,
          processedAt: true,
          createdAt: true,
          leadId: true,
          lead: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.webhookEvent.count({ where }),
    ]);

    return { data, total };
  }

  // ─── Config status (admin) ────────────────────────────────────────────────

  getConfigStatus() {
    return {
      facebook: {
        verifyToken: this.config.get<string>('FACEBOOK_WEBHOOK_VERIFY_TOKEN', ''),
        pageAccessTokenConfigured: !!this.config.get<string>('FACEBOOK_PAGE_ACCESS_TOKEN'),
        appSecretConfigured: !!this.config.get<string>('FACEBOOK_APP_SECRET'),
      },
      google: {
        key: this.config.get<string>('GOOGLE_WEBHOOK_KEY', ''),
        configured: !!this.config.get<string>('GOOGLE_WEBHOOK_KEY'),
      },
      generic: {
        secret: this.config.get<string>('GENERIC_WEBHOOK_SECRET', ''),
        configured: !!this.config.get<string>('GENERIC_WEBHOOK_SECRET'),
      },
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async fetchFacebookLeadData(
    leadgenId: string,
    accessToken: string,
  ): Promise<FacebookLeadData> {
    return new Promise((resolve, reject) => {
      const url = `https://graph.facebook.com/v18.0/${leadgenId}?access_token=${accessToken}`;
      https.get(url, (res) => {
        let raw = '';
        res.on('data', (chunk: Buffer) => (raw += chunk.toString()));
        res.on('end', () => {
          try {
            const data = JSON.parse(raw) as FacebookLeadData & { error?: { message: string } };
            if ('error' in data && data.error) {
              reject(new Error(`Facebook Graph API error: ${data.error.message}`));
            } else {
              resolve(data as FacebookLeadData);
            }
          } catch (e) {
            reject(new Error(`Failed to parse Facebook response: ${String(e)}`));
          }
        });
        res.on('error', reject);
      }).on('error', reject);
    });
  }

  private mapFacebookFields(fieldData: FacebookLeadData['field_data']): {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  } {
    const get = (name: string) =>
      fieldData.find((f) => f.name === name)?.values[0] ?? '';

    const fullName = get('full_name');
    let firstName = get('first_name') || fullName.split(' ')[0] || '';
    let lastName = get('last_name') || fullName.split(' ').slice(1).join(' ') || '';

    if (fullName && !get('first_name')) {
      const parts = fullName.split(' ');
      firstName = parts[0] ?? '';
      lastName = parts.slice(1).join(' ') ?? '';
    }

    return {
      firstName,
      lastName,
      phone: get('phone_number') || get('phone'),
      email: get('email') || undefined,
    };
  }

  private mapGoogleFields(cols: GoogleUserColumnData[]): {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  } {
    const get = (name: string) =>
      cols.find((c) => c.column_name === name)?.string_value ?? '';

    const fullName = get('FULL_NAME');
    const parts = fullName.split(' ');

    return {
      firstName: get('FIRST_NAME') || parts[0] || '',
      lastName: get('LAST_NAME') || parts.slice(1).join(' ') || '',
      phone: get('PHONE_NUMBER'),
      email: get('EMAIL') || undefined,
    };
  }

  private async createLeadFromWebhook(
    data: {
      firstName: string;
      lastName: string;
      phone: string;
      email?: string;
      notes?: string;
    },
    tenantId: string,
    source: LeadSource,
  ) {
    const phoneNormalized = normalizePhone(data.phone);
    const duplicateHash = computeDuplicateHash(phoneNormalized, data.email);

    // Detect duplicates
    const existing = await this.prisma.lead.findFirst({
      where: { tenantId, duplicateHash, deletedAt: null },
    });

    if (existing) {
      this.logger.warn(
        `Webhook duplicate lead: phone=${data.phone} tenant=${tenantId} — returning existing`,
      );
      return existing;
    }

    // Get default pipeline stage
    const defaultStage = await this.prisma.pipelineStage.findFirst({
      where: { tenantId, isDefault: true },
    });

    // Get first admin to use as actor for the activity
    const admin = await this.prisma.user.findFirst({
      where: { tenantId, role: 'ADMIN', isActive: true },
    });

    if (!admin) {
      throw new Error(`No active admin found for tenant ${tenantId}`);
    }

    const lead = await this.prisma.$transaction(async (tx) => {
      const created = await tx.lead.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email?.toLowerCase() ?? null,
          phone: data.phone,
          phoneNormalized,
          duplicateHash,
          source,
          notes: data.notes ?? null,
          stageId: defaultStage?.id ?? null,
          tenantId,
        },
      });

      await tx.activity.create({
        data: {
          type: 'LEAD_CREATED',
          description: `Lead creado automáticamente vía webhook (${source})`,
          metadata: { source, automated: true },
          leadId: created.id,
          userId: admin.id,
          tenantId,
        },
      });

      return created;
    });

    this.logger.log(`Webhook lead created: ${lead.id} (${source})`);
    return lead;
  }
}
