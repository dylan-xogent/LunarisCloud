import { Job, Worker } from 'bullmq';
import { ClamAVService } from '../services/clamav.service';
import { ApiService, VirusScanPayload } from '../services/api.service';
import { logger } from '../utils/logger';
import axios from 'axios';

export class VirusScanQueue {
  private worker: Worker;
  private clamav: ClamAVService;
  private api: ApiService;

  constructor(
    redisUrl: string,
    clamav: ClamAVService,
    api: ApiService,
    concurrency: number = 5
  ) {
    this.clamav = clamav;
    this.api = api;

    this.worker = new Worker(
      'virusScan',
      async (job: Job<VirusScanPayload>) => {
        return this.processVirusScan(job);
      },
      {
        connection: redisUrl,
        concurrency,
        removeOnComplete: 100,
        removeOnFail: 50,
      }
    );

    this.worker.on('completed', (job) => {
      logger.info(`Virus scan completed for file ${job.data.fileId}`);
    });

    this.worker.on('failed', (job, err) => {
      logger.error(`Virus scan failed for file ${job?.data.fileId}:`, err);
    });
  }

  private async processVirusScan(job: Job<VirusScanPayload>): Promise<void> {
    const { userId, fileId, s3Key, sizeBytes } = job.data;
    
    logger.info(`Starting virus scan for file ${fileId} (${s3Key})`);

    try {
      // Get download URL from API
      const downloadUrl = await this.api.getFileDownloadUrl(s3Key);
      
      // Download file stream from S3
      const response = await axios.get(downloadUrl, {
        responseType: 'stream',
        timeout: 60000, // 60 seconds timeout
      });

      // Scan the stream
      const scanResult = await this.clamav.scanStream(response.data);
      
      logger.info(`Scan completed for file ${fileId}: ${scanResult.isInfected ? 'INFECTED' : 'CLEAN'} (${scanResult.scanTime}ms)`);

      // Update file status in API
      await this.api.updateFileScanStatus(fileId, scanResult);

    } catch (error) {
      logger.error(`Virus scan failed for file ${fileId}:`, error);
      
      // Mark scan as failed in API
      await this.api.updateFileScanStatus(fileId, {
        isInfected: false,
        scanTime: 0,
      });
      
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.worker.close();
  }
}
