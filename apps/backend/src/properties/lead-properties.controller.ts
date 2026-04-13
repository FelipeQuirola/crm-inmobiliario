import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PropertiesService } from './properties.service';

@ApiTags('leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('leads')
export class LeadPropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get(':leadId/properties')
  getLeadProperties(
    @CurrentUser() user: { tenantId: string },
    @Param('leadId') leadId: string,
  ) {
    return this.propertiesService.getLeadProperties(user.tenantId, leadId);
  }
}
