import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShareDto, ShareResponseDto, PublicShareResponseDto } from './dto';
import { Share } from '@prisma/client';

@Injectable()
export class SharesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createShareDto: CreateShareDto): Promise<ShareResponseDto> {
    const { fileId, folderId, password, expiresAt, maxDownloads } = createShareDto;

    // Validate that either fileId or folderId is provided, but not both
    if (!fileId && !folderId) {
      throw new BadRequestException('Either fileId or folderId must be provided');
    }
    if (fileId && folderId) {
      throw new BadRequestException('Cannot share both file and folder simultaneously');
    }

    // Check if the file/folder exists and belongs to the user
    if (fileId) {
      const file = await this.prisma.file.findFirst({
        where: { id: fileId, userId, deletedAt: null },
      });
      if (!file) {
        throw new NotFoundException('File not found');
      }
    }

    if (folderId) {
      const folder = await this.prisma.folder.findFirst({
        where: { id: folderId, userId, deletedAt: null },
      });
      if (!folder) {
        throw new NotFoundException('Folder not found');
      }
    }

    // Create the share
    const share = await this.prisma.share.create({
      data: {
        fileId,
        folderId,
        userId,
        password: password ? await this.hashPassword(password) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        maxDownloads,
        downloadCount: 0,
      },
      include: {
        file: true,
        folder: true,
      },
    });

    return share;
  }

  async getPublicShare(shareId: string): Promise<PublicShareResponseDto> {
    const share = await this.prisma.share.findUnique({
      where: { id: shareId },
      include: {
        file: true,
        folder: true,
      },
    });

    if (!share) {
      throw new NotFoundException('Share not found');
    }

    // Check if share has expired
    if (share.expiresAt && share.expiresAt < new Date()) {
      throw new ForbiddenException('Share has expired');
    }

    // Check if download limit has been reached
    if (share.maxDownloads && share.downloadCount >= share.maxDownloads) {
      throw new ForbiddenException('Download limit reached');
    }

    return {
      id: share.id,
      fileId: share.fileId,
      folderId: share.folderId,
      requiresPassword: !!share.password,
      expiresAt: share.expiresAt,
      maxDownloads: share.maxDownloads,
      downloadCount: share.downloadCount,
      file: share.file,
      folder: share.folder,
    };
  }

  async validatePassword(shareId: string, password: string): Promise<boolean> {
    const share = await this.prisma.share.findUnique({
      where: { id: shareId },
    });

    if (!share || !share.password) {
      return false;
    }

    return this.verifyPassword(password, share.password);
  }

  async incrementDownloadCount(shareId: string): Promise<void> {
    await this.prisma.share.update({
      where: { id: shareId },
      data: {
        downloadCount: {
          increment: 1,
        },
      },
    });
  }

  async getUserShares(userId: string): Promise<ShareResponseDto[]> {
    return this.prisma.share.findMany({
      where: { userId },
      include: {
        file: true,
        folder: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteShare(userId: string, shareId: string): Promise<void> {
    const share = await this.prisma.share.findFirst({
      where: { id: shareId, userId },
    });

    if (!share) {
      throw new NotFoundException('Share not found');
    }

    await this.prisma.share.delete({
      where: { id: shareId },
    });
  }

  async purgeExpiredShares(): Promise<number> {
    const result = await this.prisma.share.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }

  private async hashPassword(password: string): Promise<string> {
    // In a real implementation, you'd use bcrypt
    // For now, we'll use a simple hash
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  private async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    const crypto = require('crypto');
    const hashedInput = crypto.createHash('sha256').update(password).digest('hex');
    return hashedInput === hashedPassword;
  }
}
