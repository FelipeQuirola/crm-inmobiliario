import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { unlink } from 'fs/promises';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, PropertyStatus } from '@prisma/client';
import { MAX_IMAGES_PER_PROPERTY, UPLOADS_BASE } from '../common/upload.config';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { ChangePropertyStatusDto } from './dto/change-property-status.dto';
import { ListPropertiesDto } from './dto/list-properties.dto';
import { LinkLeadDto } from './dto/link-lead.dto';

const PROPERTY_SELECT = {
  id: true,
  title: true,
  description: true,
  type: true,
  status: true,
  price: true,
  currency: true,
  area: true,
  bedrooms: true,
  bathrooms: true,
  parking: true,
  address: true,
  city: true,
  sector: true,
  lat: true,
  lng: true,
  features: true,
  images: true,
  createdAt: true,
  updatedAt: true,
  createdBy: {
    select: { id: true, name: true },
  },
  _count: {
    select: { interestedLeads: true },
  },
} satisfies Prisma.PropertySelect;

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string, dto: ListPropertiesDto) {
    const take = dto.take ?? 20;
    const where: Prisma.PropertyWhereInput = {
      tenantId,
      deletedAt: null,
      ...(dto.type && { type: dto.type }),
      ...(dto.status && { status: dto.status }),
      ...(dto.search && {
        OR: [
          { title: { contains: dto.search, mode: 'insensitive' } },
          { address: { contains: dto.search, mode: 'insensitive' } },
          { sector: { contains: dto.search, mode: 'insensitive' } },
          { city: { contains: dto.search, mode: 'insensitive' } },
        ],
      }),
      ...(dto.priceMin != null || dto.priceMax != null
        ? {
            price: {
              ...(dto.priceMin != null && { gte: dto.priceMin }),
              ...(dto.priceMax != null && { lte: dto.priceMax }),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        select: PROPERTY_SELECT,
        orderBy: { createdAt: 'desc' },
        take: take + 1,
        ...(dto.cursor && { cursor: { id: dto.cursor }, skip: 1 }),
      }),
      this.prisma.property.count({ where }),
    ]);

    const hasMore = items.length > take;
    const data = hasMore ? items.slice(0, take) : items;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return { data, total, nextCursor };
  }

  async findOne(tenantId: string, id: string) {
    const property = await this.prisma.property.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: {
        ...PROPERTY_SELECT,
        interestedLeads: {
          select: {
            id: true,
            notes: true,
            createdAt: true,
            lead: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
                status: true,
                assignedTo: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!property) throw new NotFoundException('Propiedad no encontrada');
    return property;
  }

  async create(tenantId: string, userId: string, dto: CreatePropertyDto) {
    return this.prisma.property.create({
      data: {
        tenantId,
        createdById: userId,
        title: dto.title,
        description: dto.description,
        type: dto.type,
        status: dto.status ?? PropertyStatus.DISPONIBLE,
        price: dto.price,
        area: dto.area,
        bedrooms: dto.bedrooms,
        bathrooms: dto.bathrooms,
        parking: dto.parking,
        address: dto.address,
        city: dto.city,
        sector: dto.sector,
        lat: dto.lat,
        lng: dto.lng,
        features: dto.features ?? [],
        images: dto.images ?? [],
      },
      select: PROPERTY_SELECT,
    });
  }

  async update(tenantId: string, id: string, dto: UpdatePropertyDto) {
    await this.assertExists(tenantId, id);
    return this.prisma.property.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.area !== undefined && { area: dto.area }),
        ...(dto.bedrooms !== undefined && { bedrooms: dto.bedrooms }),
        ...(dto.bathrooms !== undefined && { bathrooms: dto.bathrooms }),
        ...(dto.parking !== undefined && { parking: dto.parking }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.sector !== undefined && { sector: dto.sector }),
        ...(dto.lat !== undefined && { lat: dto.lat }),
        ...(dto.lng !== undefined && { lng: dto.lng }),
        ...(dto.features !== undefined && { features: dto.features }),
        ...(dto.images !== undefined && { images: dto.images }),
      },
      select: PROPERTY_SELECT,
    });
  }

  async changeStatus(tenantId: string, id: string, dto: ChangePropertyStatusDto) {
    await this.assertExists(tenantId, id);
    return this.prisma.property.update({
      where: { id },
      data: { status: dto.status },
      select: PROPERTY_SELECT,
    });
  }

  async remove(tenantId: string, id: string, userId: string, role: string) {
    const property = await this.assertExists(tenantId, id);
    if (role !== 'ADMIN' && property.createdBy.id !== userId) {
      throw new ForbiddenException('No tienes permiso para eliminar esta propiedad');
    }
    await this.prisma.property.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ── Image management ────────────────────────────────────────────────────────

  async addImages(tenantId: string, propertyId: string, filenames: string[]) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, tenantId, deletedAt: null },
      select: { id: true, images: true },
    });
    if (!property) throw new NotFoundException('Propiedad no encontrada');

    const current = property.images as string[];
    if (current.length + filenames.length > MAX_IMAGES_PER_PROPERTY) {
      throw new BadRequestException(
        `Máximo ${MAX_IMAGES_PER_PROPERTY} imágenes por propiedad`,
      );
    }

    const urls = filenames.map((f) => `/uploads/properties/${f}`);
    const updated = await this.prisma.property.update({
      where: { id: propertyId },
      data: { images: [...current, ...urls] },
      select: PROPERTY_SELECT,
    });
    return updated;
  }

  async removeImage(tenantId: string, propertyId: string, imageUrl: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, tenantId, deletedAt: null },
      select: { id: true, images: true },
    });
    if (!property) throw new NotFoundException('Propiedad no encontrada');

    const current = property.images as string[];
    if (!current.includes(imageUrl)) {
      throw new NotFoundException('Imagen no encontrada en esta propiedad');
    }

    const updated = await this.prisma.property.update({
      where: { id: propertyId },
      data: { images: current.filter((u) => u !== imageUrl) },
      select: PROPERTY_SELECT,
    });

    // Delete file from disk if it's a local upload
    if (imageUrl.startsWith('/uploads/')) {
      const relative = imageUrl.replace(/^\/uploads/, '');
      const filePath = join(UPLOADS_BASE, relative);
      await unlink(filePath).catch(() => {
        // Ignore if file doesn't exist
      });
    }

    return updated;
  }

  // ── Lead linking ────────────────────────────────────────────────────────────

  async linkLead(tenantId: string, propertyId: string, dto: LinkLeadDto) {
    await this.assertExists(tenantId, propertyId);
    const lead = await this.prisma.lead.findFirst({
      where: { id: dto.leadId, tenantId, deletedAt: null },
    });
    if (!lead) throw new NotFoundException('Lead no encontrado');

    try {
      return await this.prisma.leadProperty.create({
        data: {
          leadId: dto.leadId,
          propertyId,
          tenantId,
          notes: dto.notes,
        },
        select: {
          id: true,
          notes: true,
          createdAt: true,
          lead: { select: { id: true, firstName: true, lastName: true } },
          property: { select: { id: true, title: true } },
        },
      });
    } catch (e: unknown) {
      if (
        e instanceof Error &&
        'code' in e &&
        (e as { code: string }).code === 'P2002'
      ) {
        throw new ConflictException('El lead ya está vinculado a esta propiedad');
      }
      throw e;
    }
  }

  async unlinkLead(tenantId: string, propertyId: string, leadId: string) {
    const link = await this.prisma.leadProperty.findFirst({
      where: { propertyId, leadId, tenantId },
    });
    if (!link) throw new NotFoundException('Vínculo no encontrado');
    await this.prisma.leadProperty.delete({ where: { id: link.id } });
  }

  async getLeadProperties(tenantId: string, leadId: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id: leadId, tenantId, deletedAt: null },
    });
    if (!lead) throw new NotFoundException('Lead no encontrado');

    return this.prisma.leadProperty.findMany({
      where: { leadId, tenantId },
      select: {
        id: true,
        notes: true,
        createdAt: true,
        property: { select: { ...PROPERTY_SELECT } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private async assertExists(tenantId: string, id: string) {
    const property = await this.prisma.property.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true, createdBy: { select: { id: true } } },
    });
    if (!property) throw new NotFoundException('Propiedad no encontrada');
    return property;
  }
}
