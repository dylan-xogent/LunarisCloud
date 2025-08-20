import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class InternalService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
    private auditService: AuditService,
  ) {}

  async updateFileScanStatus(
    fileId: string,
    scanResult: {
      isInfected: boolean;
      virusName?: string;
      scanTime: number;
    }
  ): Promise<void> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      include: { owner: true },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    const updateData: any = {
      scanStatus: scanResult.isInfected ? 'infected' : 'clean',
      scanTime: scanResult.scanTime,
    };

    if (scanResult.isInfected) {
      updateData.virusName = scanResult.virusName;
      updateData.trashedAt = new Date();
    }

    await this.prisma.$transaction(async (tx) => {
      // Update file status
      await tx.file.update({
        where: { id: fileId },
        data: updateData,
      });

      // If infected, subtract from user's used bytes
      if (scanResult.isInfected) {
        await tx.user.update({
          where: { id: file.ownerId },
          data: {
            usedBytes: {
              decrement: file.sizeBytes,
            },
          },
        });

        // Log audit event
        await this.auditService.log({
          userId: file.ownerId,
          action: 'FILE_VIRUS_DETECTED',
          resourceType: 'file',
          resourceId: fileId,
          details: {
            virusName: scanResult.virusName,
            fileName: file.name,
            fileSize: file.sizeBytes.toString(),
          },
        });
      }
    });
  }

  async getFileDownloadUrl(s3Key: string): Promise<string> {
    return this.s3Service.getDownloadUrl(s3Key);
  }

  async cleanupExpiredShares(): Promise<number> {
    const result = await this.prisma.share.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }

  async reconcileUserQuota(userId?: string): Promise<void> {
    if (userId) {
      await this.reconcileSingleUserQuota(userId);
    } else {
      await this.reconcileAllUserQuotas();
    }
  }

  private async reconcileSingleUserQuota(userId: string): Promise<void> {
    const files = await this.prisma.file.findMany({
      where: {
        ownerId: userId,
        trashedAt: null,
      },
      select: {
        sizeBytes: true,
      },
    });

    const totalBytes = files.reduce((sum, file) => sum + file.sizeBytes, 0n);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        usedBytes: totalBytes,
      },
    });
  }

  private async reconcileAllUserQuotas(): Promise<void> {
    const users = await this.prisma.user.findMany({
      select: { id: true },
    });

    for (const user of users) {
      await this.reconcileSingleUserQuota(user.id);
    }
  }

  async cleanupOldTrash(): Promise<{ deletedFiles: number; deletedFolders: number }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [deletedFiles, deletedFolders] = await Promise.all([
      this.prisma.file.deleteMany({
        where: {
          trashedAt: {
            lt: thirtyDaysAgo,
          },
        },
      }),
      this.prisma.folder.deleteMany({
        where: {
          deletedAt: {
            lt: thirtyDaysAgo,
          },
        },
      }),
    ]);

    return {
      deletedFiles: deletedFiles.count,
      deletedFolders: deletedFolders.count,
    };
  }
}
