import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { FREE_TIER_QUOTA_BYTES, QuotaExceededError } from '@/types';
import { UpdateFileDto, FileResponseDto, TrashResponseDto } from './dto';

@Injectable()
export class FilesService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {}

  async initiateUpload(userId: string, folderId: string | null, name: string, sizeBytes: number, mime: string) {
    // Check quota
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newUsedBytes = user.usedBytes + BigInt(sizeBytes);
    const quotaBytes = user.plan === 'PRO' ? BigInt(100 * 1024 * 1024 * 1024) : FREE_TIER_QUOTA_BYTES; // 100GB for PRO

    if (newUsedBytes > quotaBytes) {
      throw new QuotaExceededError();
    }

    // Generate S3 key
    const s3Key = this.s3Service.generateS3Key(userId, name);

    // Create multipart upload
    const uploadId = await this.s3Service.createMultipartUpload(s3Key, mime);

    // Calculate parts
    const parts = this.s3Service.calculateParts(sizeBytes);
    const presignedUrls = await Promise.all(
      parts.map(async (part) => ({
        partNumber: part.partNumber,
        presignedUrl: await this.s3Service.getUploadPartUrl(s3Key, uploadId, part.partNumber),
      }))
    );

    // Store upload session in database (you might want to create a separate table for this)
    // For now, we'll store it in memory or use Redis

    return {
      uploadId,
      parts: presignedUrls,
      s3Key,
    };
  }

  async completeUpload(userId: string, uploadId: string, etag: string) {
    // Get upload session (from database or Redis)
    // For now, we'll assume the s3Key is passed or stored somewhere
    
    // Complete the multipart upload
    // This is a simplified version - in reality, you'd need to track the upload session
    
    // Create file record
    const file = await this.prisma.file.create({
      data: {
        ownerId: userId,
        name: 'temp', // You'd get this from the upload session
        sizeBytes: 0n, // You'd get this from the upload session
        mime: 'application/octet-stream', // You'd get this from the upload session
        etag,
        s3Key: 'temp', // You'd get this from the upload session
        version: 1,
      },
    });

    // Update user's used bytes
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        usedBytes: {
          increment: file.sizeBytes,
        },
      },
    });

    return file;
  }

  async getFile(userId: string, fileId: string) {
    const file = await this.prisma.file.findFirst({
      where: {
        id: fileId,
        ownerId: userId,
        trashedAt: null,
      },
      include: {
        folder: true,
      },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return file;
  }

  async getFiles(userId: string, folderId: string | null = null, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [files, total] = await Promise.all([
      this.prisma.file.findMany({
        where: {
          ownerId: userId,
          folderId,
          trashedAt: null,
        },
        include: {
          folder: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.file.count({
        where: {
          ownerId: userId,
          folderId,
          trashedAt: null,
        },
      }),
    ]);

    return {
      items: files,
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    };
  }

  async updateFile(userId: string, fileId: string, updateFileDto: UpdateFileDto): Promise<FileResponseDto> {
    const file = await this.getFile(userId, fileId);
    const { name, folderId } = updateFileDto;

    // Check if moving to a different folder
    if (folderId && folderId !== file.folderId) {
      const folder = await this.prisma.folder.findFirst({
        where: { id: folderId, userId, deletedAt: null },
      });
      if (!folder) {
        throw new NotFoundException('Target folder not found');
      }
    }

    // Check if file with same name already exists in the target folder
    if (name && name !== file.name) {
      const existingFile = await this.prisma.file.findFirst({
        where: {
          name,
          folderId: folderId || file.folderId || null,
          userId,
          deletedAt: null,
          id: { not: fileId },
        },
      });

      if (existingFile) {
        throw new BadRequestException('A file with this name already exists in this location');
      }
    }

    const updatedFile = await this.prisma.file.update({
      where: { id: fileId },
      data: {
        ...(name && { name }),
        ...(folderId !== undefined && { folderId }),
      },
      include: {
        folder: true,
      },
    });

    return updatedFile;
  }

  async deleteFile(userId: string, fileId: string) {
    const file = await this.getFile(userId, fileId);

    // Soft delete
    await this.prisma.file.update({
      where: { id: fileId },
      data: {
        trashedAt: new Date(),
      },
    });

    // Update user's used bytes
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        usedBytes: {
          decrement: file.sizeBytes,
        },
      },
    });

    return { message: 'File moved to trash' };
  }

  async restoreFile(userId: string, fileId: string) {
    const file = await this.prisma.file.findFirst({
      where: {
        id: fileId,
        ownerId: userId,
        trashedAt: { not: null },
      },
    });

    if (!file) {
      throw new NotFoundException('File not found in trash');
    }

    // Check quota before restoring
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const newUsedBytes = user.usedBytes + file.sizeBytes;
    const quotaBytes = user.plan === 'PRO' ? BigInt(100 * 1024 * 1024 * 1024) : FREE_TIER_QUOTA_BYTES;

    if (newUsedBytes > quotaBytes) {
      throw new QuotaExceededError('Cannot restore file: quota would be exceeded');
    }

    // Restore file
    await this.prisma.file.update({
      where: { id: fileId },
      data: {
        trashedAt: null,
      },
    });

    // Update user's used bytes
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        usedBytes: {
          increment: file.sizeBytes,
        },
      },
    });

    return { message: 'File restored successfully' };
  }

  async getDownloadUrl(userId: string, fileId: string) {
    const file = await this.getFile(userId, fileId);

    const downloadUrl = await this.s3Service.getDownloadUrl(file.s3Key);

    return {
      downloadUrl,
      fileName: file.name,
      contentType: file.mime,
    };
  }

  async getTrash(userId: string, page: number = 1, limit: number = 20): Promise<TrashResponseDto> {
    const skip = (page - 1) * limit;

    const [files, folders, totalFiles, totalFolders] = await Promise.all([
      this.prisma.file.findMany({
        where: {
          userId,
          deletedAt: { not: null },
        },
        orderBy: {
          deletedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.folder.findMany({
        where: {
          userId,
          deletedAt: { not: null },
        },
        orderBy: {
          deletedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.file.count({
        where: {
          userId,
          deletedAt: { not: null },
        },
      }),
      this.prisma.folder.count({
        where: {
          userId,
          deletedAt: { not: null },
        },
      }),
    ]);

    return {
      files,
      folders,
      total: totalFiles + totalFolders,
      page,
      limit,
    };
  }

  async emptyTrash(userId: string): Promise<{ message: string }> {
    const [trashedFiles, trashedFolders] = await Promise.all([
      this.prisma.file.findMany({
        where: {
          userId,
          deletedAt: { not: null },
        },
      }),
      this.prisma.folder.findMany({
        where: {
          userId,
          deletedAt: { not: null },
        },
      }),
    ]);

    // Calculate total size to subtract from user's used bytes
    const totalSize = trashedFiles.reduce((sum, file) => sum + file.size, 0n);

    // Delete files from S3
    await Promise.all(
      trashedFiles.map((file) => this.s3Service.deleteFile(file.s3Key))
    );

    // Delete from database
    await Promise.all([
      this.prisma.file.deleteMany({
        where: {
          userId,
          deletedAt: { not: null },
        },
      }),
      this.prisma.folder.deleteMany({
        where: {
          userId,
          deletedAt: { not: null },
        },
      }),
    ]);

    // Update user's used bytes
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        usedBytes: {
          decrement: totalSize,
        },
      },
    });

    return { message: 'Trash emptied successfully' };
  }

  async reconcileUsedBytes(userId: string): Promise<{ message: string; reconciledBytes: bigint }> {
    // Get all files for the user
    const files = await this.prisma.file.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      select: {
        size: true,
      },
    });

    // Calculate actual used bytes
    const actualUsedBytes = files.reduce((sum, file) => sum + file.size, 0n);

    // Update user's used bytes
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        usedBytes: actualUsedBytes,
      },
    });

    return {
      message: 'Used bytes reconciled successfully',
      reconciledBytes: actualUsedBytes,
    };
  }
}
