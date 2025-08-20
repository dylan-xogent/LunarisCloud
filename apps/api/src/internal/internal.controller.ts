import { Controller, Post, Get, Param, Body, Query, UseGuards } from '@nestjs/common';
import { InternalService } from './internal.service';
import { ApiSecretGuard } from './guards/api-secret.guard';

@Controller('internal')
@UseGuards(ApiSecretGuard)
export class InternalController {
  constructor(private readonly internalService: InternalService) {}

  @Post('files/:fileId/scan-result')
  async updateFileScanStatus(
    @Param('fileId') fileId: string,
    @Body() scanResult: {
      isInfected: boolean;
      virusName?: string;
      scanTime: number;
    }
  ) {
    await this.internalService.updateFileScanStatus(fileId, scanResult);
    return { success: true };
  }

  @Get('files/download-url')
  async getFileDownloadUrl(@Query('s3Key') s3Key: string) {
    const downloadUrl = await this.internalService.getFileDownloadUrl(s3Key);
    return { downloadUrl };
  }

  @Post('shares/cleanup-expired')
  async cleanupExpiredShares() {
    const deletedCount = await this.internalService.cleanupExpiredShares();
    return { deletedCount };
  }

  @Post('users/:userId/reconcile-quota')
  async reconcileUserQuota(@Param('userId') userId: string) {
    await this.internalService.reconcileUserQuota(userId);
    return { success: true };
  }

  @Post('users/reconcile-all-quotas')
  async reconcileAllUserQuotas() {
    await this.internalService.reconcileUserQuota();
    return { success: true };
  }

  @Post('trash/cleanup-old')
  async cleanupOldTrash() {
    const result = await this.internalService.cleanupOldTrash();
    return result;
  }
}
