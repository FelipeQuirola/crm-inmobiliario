import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { ListLeadsDto } from './dto/list-leads.dto';
import { AssignLeadDto } from './dto/assign-lead.dto';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '@/auth/types/jwt-payload.type';

@ApiTags('Leads')
@ApiBearerAuth()
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  // -------------------------------------------------------------------------
  // POST /leads/import  (ADMIN only — must be before :id routes)
  // -------------------------------------------------------------------------

  @Post('import')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
      fileFilter: (_req, file, cb) => {
        const allowed = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ];
        if (allowed.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls)$/i)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Solo se permiten archivos .xlsx o .xls'), false);
        }
      },
    }),
  )
  @ApiOperation({ summary: 'Importar leads desde Excel (solo ADMIN)' })
  importFromExcel(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    if (!file) throw new BadRequestException('Archivo requerido');
    return this.leadsService.importFromExcel(file.buffer, actor);
  }

  // -------------------------------------------------------------------------
  // POST /leads
  // -------------------------------------------------------------------------

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear lead',
    description:
      'Crea un nuevo lead. Detecta duplicados por hash de teléfono+email. ' +
      'VENDEDOR se auto-asigna; ADMIN puede especificar assignedToId.',
  })
  @ApiResponse({ status: 201, description: 'Lead creado exitosamente' })
  @ApiResponse({
    status: 409,
    description: 'Duplicado detectado — retorna el lead existente',
  })
  create(
    @Body() dto: CreateLeadDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.leadsService.create(dto, actor);
  }

  // -------------------------------------------------------------------------
  // GET /leads
  // -------------------------------------------------------------------------

  @Get()
  @ApiOperation({
    summary: 'Listar leads',
    description:
      'Paginación cursor-based. VENDEDOR solo ve sus leads asignados. ' +
      'ADMIN puede filtrar por cualquier vendedor.',
  })
  @ApiResponse({ status: 200, description: 'Lista de leads con nextCursor y total' })
  findAll(
    @Query() query: ListLeadsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.leadsService.findAll(query, actor);
  }

  // -------------------------------------------------------------------------
  // GET /leads/:id
  // -------------------------------------------------------------------------

  @Get(':id')
  @ApiOperation({
    summary: 'Detalle de un lead',
    description: 'Incluye etapa, vendedor asignado y últimas 5 actividades.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Lead encontrado' })
  @ApiResponse({ status: 404, description: 'Lead no encontrado' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.leadsService.findOne(id, actor);
  }

  // -------------------------------------------------------------------------
  // PATCH /leads/:id
  // -------------------------------------------------------------------------

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar lead',
    description:
      'Actualiza campos del lead. Registra en bitácora si cambia stageId o assignedToId.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Lead actualizado' })
  @ApiResponse({ status: 404, description: 'Lead no encontrado' })
  @ApiResponse({
    status: 409,
    description: 'Nuevos datos crean duplicado con otro lead',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeadDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.leadsService.update(id, dto, actor);
  }

  // -------------------------------------------------------------------------
  // PATCH /leads/:id/status
  // -------------------------------------------------------------------------

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Cambiar status del lead',
    description:
      'Cambia el status (ACTIVE, PAUSED, WON, LOST). ' +
      'lostReason es obligatorio cuando status es LOST.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Status actualizado' })
  @ApiResponse({ status: 400, description: 'lostReason requerido para LOST' })
  @ApiResponse({ status: 404, description: 'Lead no encontrado' })
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.leadsService.changeStatus(id, dto, actor);
  }

  // -------------------------------------------------------------------------
  // PATCH /leads/:id/assign
  // -------------------------------------------------------------------------

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Asignar / reasignar lead (solo ADMIN)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignLeadDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.leadsService.assign(id, dto.assignedToId, actor);
  }

  // -------------------------------------------------------------------------
  // DELETE /leads/:id
  // -------------------------------------------------------------------------

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar lead (soft delete)',
    description: 'Solo ADMIN. Marca deletedAt — el lead no se borra de la DB.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Lead eliminado' })
  @ApiResponse({ status: 403, description: 'Solo ADMIN puede eliminar leads' })
  @ApiResponse({ status: 404, description: 'Lead no encontrado' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.leadsService.remove(id, actor);
  }
}
