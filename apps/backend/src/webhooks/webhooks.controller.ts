import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { WebhooksService } from './webhooks.service';
import { GenericWebhookDto } from './dto/generic-webhook.dto';
import { ListWebhookEventsDto } from './dto/list-webhook-events.dto';
import { Public } from '@/auth/decorators/public.decorator';
import { Roles } from '@/auth/decorators/roles.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '@/auth/types/jwt-payload.type';
import type { GoogleWebhookBody } from './dto/google-webhook.dto';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  // ─── Facebook: GET verification ───────────────────────────────────────────

  @Public()
  @Get('facebook')
  @ApiOperation({ summary: 'Facebook webhook verification' })
  @ApiQuery({ name: 'hub.mode', required: false })
  @ApiQuery({ name: 'hub.verify_token', required: false })
  @ApiQuery({ name: 'hub.challenge', required: false })
  verifyFacebook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ): void {
    const result = this.webhooksService.verifyFacebook(mode, token, challenge);
    // Facebook expects a plain text/integer response
    res.status(HttpStatus.OK).send(result);
  }

  // ─── Facebook: POST receive leads ─────────────────────────────────────────

  @Public()
  @Post('facebook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive Facebook Lead Ads webhook' })
  async receiveFacebook(@Body() body: unknown): Promise<{ status: string }> {
    // Respond immediately — Facebook requires < 20s
    void this.webhooksService.enqueueFacebookWebhook(body);
    return { status: 'ok' };
  }

  // ─── Google: POST receive leads ───────────────────────────────────────────

  @Public()
  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive Google Ads Lead Form webhook' })
  @ApiQuery({ name: 'slug', required: true })
  receiveGoogle(
    @Body() body: GoogleWebhookBody,
    @Query('slug') slug: string,
  ) {
    return this.webhooksService.processGoogleWebhook(body, slug);
  }

  // ─── Generic webhook ──────────────────────────────────────────────────────

  @Public()
  @Post('generic')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generic webhook to create leads from any form' })
  @ApiQuery({ name: 'slug', required: true })
  receiveGeneric(
    @Body() dto: GenericWebhookDto,
    @Headers('x-webhook-secret') secret: string,
    @Query('slug') slug: string,
  ) {
    return this.webhooksService.processGenericWebhook(dto, secret, slug);
  }

  // ─── Admin: list events ───────────────────────────────────────────────────

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Get('events')
  @ApiOperation({ summary: 'List webhook events (admin only)' })
  listEvents(
    @CurrentUser() user: AuthenticatedUser,
    @Query() dto: ListWebhookEventsDto,
  ) {
    return this.webhooksService.listEvents(user.tenantId, dto);
  }

  // ─── Admin: config status ─────────────────────────────────────────────────

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Get('config')
  @ApiOperation({ summary: 'Get webhook config status (admin only)' })
  getConfig() {
    return this.webhooksService.getConfigStatus();
  }
}
