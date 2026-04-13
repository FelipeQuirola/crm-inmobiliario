import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { UPLOADS_BASE } from '@/common/upload.config';
import { UsersService } from './users.service';
import { Roles } from '@/auth/decorators/roles.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '@/auth/types/jwt-payload.type';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangeOwnPasswordDto } from './dto/change-own-password.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─── GET /users/profile ───────────────────────────────────────────────────

  @Get('profile')
  getProfile(@CurrentUser() actor: AuthenticatedUser) {
    return this.usersService.getProfile(actor.id, actor.tenantId);
  }

  // ─── PATCH /users/profile ─────────────────────────────────────────────────

  @Patch('profile')
  updateProfile(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(actor.id, actor.tenantId, dto);
  }

  // ─── PATCH /users/profile/password ───────────────────────────────────────

  @Patch('profile/password')
  @HttpCode(HttpStatus.OK)
  changeOwnPassword(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: ChangeOwnPasswordDto,
  ) {
    return this.usersService.changeOwnPassword(actor.id, actor.tenantId, dto);
  }

  // ─── POST /users/profile/avatar ───────────────────────────────────────────

  @Post('profile/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: join(UPLOADS_BASE, 'avatars'),
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|webp|gif)$/)) {
          cb(new Error('Solo se permiten imágenes (jpg, png, webp, gif)'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async uploadAvatar(
    @CurrentUser() actor: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    return this.usersService.updateAvatarUrl(actor.id, avatarUrl);
  }

  // ─── GET /users/active ───────────────────────────────────────────────────
  // Accessible by all authenticated users (VENDEDOR needs this for PDF selector)

  @Get('active')
  findActive(@CurrentUser() actor: AuthenticatedUser) {
    return this.usersService.findActiveInTenant(actor.tenantId);
  }

  // ─── GET /users ───────────────────────────────────────────────────────────

  @Get()
  @Roles(Role.ADMIN)
  findAll(@CurrentUser() actor: AuthenticatedUser) {
    return this.usersService.findAllInTenant(actor);
  }

  // ─── POST /users ──────────────────────────────────────────────────────────

  @Post()
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateUserDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.create(dto, actor);
  }

  // ─── GET /users/:id ───────────────────────────────────────────────────────

  @Get(':id')
  @Roles(Role.ADMIN)
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.findOne(id, actor);
  }

  // ─── PATCH /users/:id ─────────────────────────────────────────────────────

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.update(id, dto, actor);
  }

  // ─── PATCH /users/:id/password ────────────────────────────────────────────

  @Patch(':id/password')
  @Roles(Role.ADMIN)
  changePassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangePasswordDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.changePassword(id, dto, actor);
  }

  // ─── DELETE /users/:id ────────────────────────────────────────────────────

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.deactivate(id, actor);
  }
}
