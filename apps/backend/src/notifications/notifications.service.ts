import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import { ListNotificationsDto } from './dto/list-notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── List user notifications ──────────────────────────────────────────────

  async findAll(userId: string, tenantId: string, dto: ListNotificationsDto) {
    const where = {
      userId,
      tenantId,
      ...(dto.isRead !== undefined ? { isRead: dto.isRead } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: dto.limit ?? 20,
        skip: dto.offset ?? 0,
        include: {
          lead: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { data, total };
  }

  // ─── Unread count ─────────────────────────────────────────────────────────

  async unreadCount(userId: string, tenantId: string): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({
      where: { userId, tenantId, isRead: false },
    });
    return { count };
  }

  // ─── Mark one as read ─────────────────────────────────────────────────────

  async markAsRead(id: string, userId: string, tenantId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, tenantId },
    });

    if (!notification) throw new NotFoundException('Notificación no encontrada');
    if (notification.userId !== userId) throw new ForbiddenException();

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  // ─── Mark all as read ─────────────────────────────────────────────────────

  async markAllAsRead(userId: string, tenantId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, tenantId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { success: true };
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  async remove(id: string, userId: string, tenantId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, tenantId },
    });

    if (!notification) throw new NotFoundException('Notificación no encontrada');
    if (notification.userId !== userId) throw new ForbiddenException();

    await this.prisma.notification.delete({ where: { id } });
    return { success: true };
  }

  // ─── Create (used by RemindersProcessor) ─────────────────────────────────

  async create(data: {
    tenantId: string;
    userId: string;
    leadId?: string;
    type: NotificationType;
    title: string;
    message: string;
  }) {
    return this.prisma.notification.create({ data });
  }

  // ─── Check duplicate in last 24h ─────────────────────────────────────────

  async existsRecent(data: {
    userId: string;
    leadId?: string;
    type: NotificationType;
  }): Promise<boolean> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const count = await this.prisma.notification.count({
      where: {
        userId: data.userId,
        ...(data.leadId ? { leadId: data.leadId } : {}),
        type: data.type,
        createdAt: { gte: since },
      },
    });
    return count > 0;
  }
}
