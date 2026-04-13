import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '@/auth/types/jwt-payload.type';
import { MessagesService } from './messages.service';
import { SendWhatsAppDto } from './dto/send-whatsapp.dto';
import { SendEmailDto } from './dto/send-email.dto';

@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('whatsapp')
  @HttpCode(HttpStatus.OK)
  sendWhatsApp(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: SendWhatsAppDto,
  ) {
    return this.messagesService.sendWhatsApp(actor, dto);
  }

  @Post('email')
  @HttpCode(HttpStatus.OK)
  sendEmail(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: SendEmailDto,
  ) {
    return this.messagesService.sendEmail(actor, dto);
  }

  @Get('lead/:leadId')
  getLeadMessages(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('leadId', ParseUUIDPipe) leadId: string,
  ) {
    return this.messagesService.getLeadMessages(actor, leadId);
  }
}
