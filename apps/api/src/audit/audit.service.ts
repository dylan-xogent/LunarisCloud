import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export enum AuditAction {
  // User actions
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_REGISTER = 'USER_REGISTER',
  USER_EMAIL_VERIFIED = 'USER_EMAIL_VERIFIED',
  
  // File actions
  FILE_UPLOAD = 'FILE_UPLOAD',
  FILE_DOWNLOAD = 'FILE_DOWNLOAD',
  FILE_DELETE = 'FILE_DELETE',
  FILE_RESTORE = 'FILE_RESTORE',
  FILE_UPDATE = 'FILE_UPDATE',
  
  // Folder actions
  FOLDER_CREATE = 'FOLDER_CREATE',
  FOLDER_DELETE = 'FOLDER_DELETE',
  FOLDER_RESTORE = 'FOLDER_RESTORE',
  FOLDER_UPDATE = 'FOLDER_UPDATE',
  
  // Share actions
  SHARE_CREATE = 'SHARE_CREATE',
  SHARE_DELETE = 'SHARE_DELETE',
  SHARE_ACCESS = 'SHARE_ACCESS',
  
  // System actions
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
}

export interface AuditLogData {
  userId?: string;
  action: AuditAction;
  resourceType?: 'file' | 'folder' | 'share' | 'user';
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          resourceType: data.resourceType,
          resourceId: data.resourceId,
          details: data.details,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (error) {
      // Don't let audit logging failures break the main application
      console.error('Failed to create audit log:', error);
    }
  }

  async getUserAuditLogs(userId: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({
        where: { userId },
      }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    };
  }

  async getSystemAuditLogs(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count(),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    };
  }
}
