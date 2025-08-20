import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { SharesService } from '../shares/shares.service';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private prisma: PrismaService,
    private sharesService: SharesService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async purgeExpiredShares() {
    this.logger.log('Starting expired shares cleanup...');
    
    try {
      const deletedCount = await this.sharesService.purgeExpiredShares();
      this.logger.log(`Purged ${deletedCount} expired shares`);
    } catch (error) {
      this.logger.error('Failed to purge expired shares', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async reconcileAllUsersUsedBytes() {
    this.logger.log('Starting user quota reconciliation...');
    
    try {
      const users = await this.prisma.user.findMany({
        select: { id: true },
      });

      let reconciledCount = 0;
      for (const user of users) {
        try {
          await this.reconcileUserUsedBytes(user.id);
          reconciledCount++;
        } catch (error) {
          this.logger.error(`Failed to reconcile user ${user.id}`, error);
        }
      }

      this.logger.log(`Reconciled ${reconciledCount} users`);
    } catch (error) {
      this.logger.error('Failed to reconcile user quotas', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupOldSoftDeletedItems() {
    this.logger.log('Starting cleanup of old soft-deleted items...');
    
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Delete old soft-deleted files
      const deletedFiles = await this.prisma.file.deleteMany({
        where: {
          deletedAt: {
            lt: thirtyDaysAgo,
          },
        },
      });

      // Delete old soft-deleted folders
      const deletedFolders = await this.prisma.folder.deleteMany({
        where: {
          deletedAt: {
            lt: thirtyDaysAgo,
          },
        },
      });

      this.logger.log(`Permanently deleted ${deletedFiles.count} files and ${deletedFolders.count} folders`);
    } catch (error) {
      this.logger.error('Failed to cleanup old soft-deleted items', error);
    }
  }

  private async reconcileUserUsedBytes(userId: string): Promise<void> {
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
  }
}
