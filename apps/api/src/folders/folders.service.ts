import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFolderDto, UpdateFolderDto, FolderResponseDto } from './dto';
import { Folder, Prisma } from '@prisma/client';

@Injectable()
export class FoldersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createFolderDto: CreateFolderDto): Promise<FolderResponseDto> {
    const { name, parentId } = createFolderDto;

    // Check if parent folder exists and belongs to user
    if (parentId) {
      const parentFolder = await this.prisma.folder.findFirst({
        where: { id: parentId, userId, deletedAt: null },
      });
      if (!parentFolder) {
        throw new NotFoundException('Parent folder not found');
      }
    }

    // Check if folder with same name already exists in the same parent
    const existingFolder = await this.prisma.folder.findFirst({
      where: {
        name,
        parentId: parentId || null,
        userId,
        deletedAt: null,
      },
    });

    if (existingFolder) {
      throw new BadRequestException('A folder with this name already exists in this location');
    }

    const folder = await this.prisma.folder.create({
      data: {
        name,
        parentId,
        userId,
      },
      include: {
        _count: {
          select: {
            children: true,
            files: true,
          },
        },
      },
    });

    return folder;
  }

  async findOne(userId: string, id: string): Promise<FolderResponseDto> {
    const folder = await this.prisma.folder.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        _count: {
          select: {
            children: true,
            files: true,
          },
        },
      },
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    return folder;
  }

  async findChildren(
    userId: string,
    id: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<{
    folders: FolderResponseDto[];
    files: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    const folder = await this.findOne(userId, id);

    const skip = (page - 1) * limit;

    const [folders, files, totalFolders, totalFiles] = await Promise.all([
      this.prisma.folder.findMany({
        where: { parentId: id, userId, deletedAt: null },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              children: true,
              files: true,
            },
          },
        },
      }),
      this.prisma.file.findMany({
        where: { folderId: id, userId, deletedAt: null },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.folder.count({
        where: { parentId: id, userId, deletedAt: null },
      }),
      this.prisma.file.count({
        where: { folderId: id, userId, deletedAt: null },
      }),
    ]);

    return {
      folders,
      files,
      total: totalFolders + totalFiles,
      page,
      limit,
    };
  }

  async getBreadcrumbs(userId: string, id: string): Promise<FolderResponseDto[]> {
    const breadcrumbs: FolderResponseDto[] = [];
    let currentFolder = await this.findOne(userId, id);

    while (currentFolder) {
      breadcrumbs.unshift(currentFolder);
      if (currentFolder.parentId) {
        currentFolder = await this.findOne(userId, currentFolder.parentId);
      } else {
        break;
      }
    }

    return breadcrumbs;
  }

  async update(userId: string, id: string, updateFolderDto: UpdateFolderDto): Promise<FolderResponseDto> {
    const folder = await this.findOne(userId, id);
    const { name, parentId } = updateFolderDto;

    // Check if moving to a new parent
    if (parentId && parentId !== folder.parentId) {
      // Check if parent exists and belongs to user
      const parentFolder = await this.prisma.folder.findFirst({
        where: { id: parentId, userId, deletedAt: null },
      });
      if (!parentFolder) {
        throw new NotFoundException('Parent folder not found');
      }

      // Check if moving to a descendant (would create circular reference)
      if (await this.isDescendant(id, parentId, userId)) {
        throw new BadRequestException('Cannot move folder to its descendant');
      }
    }

    // Check if folder with same name already exists in the target parent
    if (name && name !== folder.name) {
      const existingFolder = await this.prisma.folder.findFirst({
        where: {
          name,
          parentId: parentId || folder.parentId || null,
          userId,
          deletedAt: null,
          id: { not: id },
        },
      });

      if (existingFolder) {
        throw new BadRequestException('A folder with this name already exists in this location');
      }
    }

    const updatedFolder = await this.prisma.folder.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(parentId !== undefined && { parentId }),
      },
      include: {
        _count: {
          select: {
            children: true,
            files: true,
          },
        },
      },
    });

    return updatedFolder;
  }

  async remove(userId: string, id: string): Promise<void> {
    const folder = await this.findOne(userId, id);

    // Soft delete the folder and all its descendants
    await this.softDeleteFolderAndDescendants(id);
  }

  private async softDeleteFolderAndDescendants(folderId: string): Promise<void> {
    // Get all descendants
    const descendants = await this.getAllDescendants(folderId);

    // Soft delete all descendants first
    for (const descendant of descendants) {
      await this.prisma.folder.update({
        where: { id: descendant.id },
        data: { deletedAt: new Date() },
      });
    }

    // Soft delete the folder itself
    await this.prisma.folder.update({
      where: { id: folderId },
      data: { deletedAt: new Date() },
    });
  }

  private async getAllDescendants(folderId: string): Promise<Folder[]> {
    const descendants: Folder[] = [];
    const queue = [folderId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = await this.prisma.folder.findMany({
        where: { parentId: currentId, deletedAt: null },
      });

      for (const child of children) {
        descendants.push(child);
        queue.push(child.id);
      }
    }

    return descendants;
  }

  private async isDescendant(folderId: string, potentialDescendantId: string, userId: string): Promise<boolean> {
    const descendants = await this.getAllDescendants(folderId);
    return descendants.some(descendant => descendant.id === potentialDescendantId);
  }
}
