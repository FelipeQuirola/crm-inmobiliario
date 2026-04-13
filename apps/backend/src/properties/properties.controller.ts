import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  HttpCode,
  HttpStatus,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PropertiesService } from './properties.service';
import { PdfService } from '../pdf/pdf.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { ChangePropertyStatusDto } from './dto/change-property-status.dto';
import { ListPropertiesDto } from './dto/list-properties.dto';
import { LinkLeadDto } from './dto/link-lead.dto';
import {
  propertyImageStorage,
  imageFileFilter,
  MAX_IMAGE_SIZE,
  MAX_IMAGES_PER_PROPERTY,
} from '../common/upload.config';

@ApiTags('properties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('properties')
export class PropertiesController {
  constructor(
    private readonly propertiesService: PropertiesService,
    private readonly pdfService: PdfService,
  ) {}

  @Get()
  list(
    @CurrentUser() user: { tenantId: string },
    @Query() dto: ListPropertiesDto,
  ) {
    return this.propertiesService.list(user.tenantId, dto);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: { tenantId: string },
    @Param('id') id: string,
  ) {
    return this.propertiesService.findOne(user.tenantId, id);
  }

  @Get(':id/pdf')
  async downloadPdf(
    @CurrentUser() user: { tenantId: string },
    @Param('id') id: string,
    @Query('agentId') agentId: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const { pdf, filename } = await this.pdfService.generatePropertyPdf(
      id,
      user.tenantId,
      agentId,
    );
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(pdf.length),
    });
    res.end(pdf);
  }

  @Post()
  create(
    @CurrentUser() user: { id: string; tenantId: string },
    @Body() dto: CreatePropertyDto,
  ) {
    return this.propertiesService.create(user.tenantId, user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { tenantId: string },
    @Param('id') id: string,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.propertiesService.update(user.tenantId, id, dto);
  }

  @Patch(':id/status')
  changeStatus(
    @CurrentUser() user: { tenantId: string },
    @Param('id') id: string,
    @Body() dto: ChangePropertyStatusDto,
  ) {
    return this.propertiesService.changeStatus(user.tenantId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: { id: string; tenantId: string; role: string },
    @Param('id') id: string,
  ) {
    return this.propertiesService.remove(user.tenantId, id, user.id, user.role);
  }

  @Post(':id/images')
  @UseInterceptors(
    FilesInterceptor('files', MAX_IMAGES_PER_PROPERTY, {
      storage: propertyImageStorage,
      fileFilter: imageFileFilter,
      limits: { fileSize: MAX_IMAGE_SIZE },
    }),
  )
  uploadImages(
    @CurrentUser() user: { tenantId: string },
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Se requiere al menos un archivo');
    }
    return this.propertiesService.addImages(
      user.tenantId,
      id,
      files.map((f) => f.filename),
    );
  }

  @Delete(':id/images')
  @HttpCode(HttpStatus.OK)
  removeImage(
    @CurrentUser() user: { tenantId: string },
    @Param('id') id: string,
    @Body() body: { imageUrl: string },
  ) {
    return this.propertiesService.removeImage(user.tenantId, id, body.imageUrl);
  }

  @Post(':id/leads')
  linkLead(
    @CurrentUser() user: { tenantId: string },
    @Param('id') id: string,
    @Body() dto: LinkLeadDto,
  ) {
    return this.propertiesService.linkLead(user.tenantId, id, dto);
  }

  @Delete(':id/leads/:leadId')
  @HttpCode(HttpStatus.NO_CONTENT)
  unlinkLead(
    @CurrentUser() user: { tenantId: string },
    @Param('id') id: string,
    @Param('leadId') leadId: string,
  ) {
    return this.propertiesService.unlinkLead(user.tenantId, id, leadId);
  }
}
