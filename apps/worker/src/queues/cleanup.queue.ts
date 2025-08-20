import { Job, Worker } from 'bullmq';
import { ApiService } from '../services/api.service';
import { logger } from '../utils/logger';

export interface ShareCleanupPayload {
  // No payload needed for share cleanup
}

export interface ReconcilePayload {
  userId?: string;
}

export interface TrashCleanupPayload {
  // No payload needed for trash cleanup
}

export class CleanupQueue {
  private shareCleanupWorker: Worker;
  private reconcileWorker: Worker;
  private trashCleanupWorker: Worker;
  private api: ApiService;

  constructor(redisUrl: string, api: ApiService) {
    this.api = api;

    // Share cleanup worker
    this.shareCleanupWorker = new Worker(
      'shareCleanup',
      async (job: Job<ShareCleanupPayload>) => {
        return this.processShareCleanup(job);
      },
      {
        connection: redisUrl,
        concurrency: 1,
        removeOnComplete: 50,
        removeOnFail: 10,
      }
    );

    // Reconcile worker
    this.reconcileWorker = new Worker(
      'reconcile',
      async (job: Job<ReconcilePayload>) => {
        return this.processReconcile(job);
      },
      {
        connection: redisUrl,
        concurrency: 3,
        removeOnComplete: 50,
        removeOnFail: 10,
      }
    );

    // Trash cleanup worker
    this.trashCleanupWorker = new Worker(
      'trashCleanup',
      async (job: Job<TrashCleanupPayload>) => {
        return this.processTrashCleanup(job);
      },
      {
        connection: redisUrl,
        concurrency: 1,
        removeOnComplete: 50,
        removeOnFail: 10,
      }
    );

    // Event handlers
    this.shareCleanupWorker.on('completed', (job) => {
      logger.info('Share cleanup completed');
    });

    this.shareCleanupWorker.on('failed', (job, err) => {
      logger.error('Share cleanup failed:', err);
    });

    this.reconcileWorker.on('completed', (job) => {
      logger.info(`Quota reconciliation completed for user: ${job.data.userId || 'all'}`);
    });

    this.reconcileWorker.on('failed', (job, err) => {
      logger.error(`Quota reconciliation failed for user ${job?.data.userId || 'all'}:`, err);
    });

    this.trashCleanupWorker.on('completed', (job) => {
      logger.info('Trash cleanup completed');
    });

    this.trashCleanupWorker.on('failed', (job, err) => {
      logger.error('Trash cleanup failed:', err);
    });
  }

  private async processShareCleanup(job: Job<ShareCleanupPayload>): Promise<number> {
    logger.info('Starting expired share cleanup');
    
    try {
      const deletedCount = await this.api.cleanupExpiredShares();
      logger.info(`Cleaned up ${deletedCount} expired shares`);
      return deletedCount;
    } catch (error) {
      logger.error('Share cleanup failed:', error);
      throw error;
    }
  }

  private async processReconcile(job: Job<ReconcilePayload>): Promise<void> {
    const { userId } = job.data;
    logger.info(`Starting quota reconciliation for user: ${userId || 'all'}`);
    
    try {
      await this.api.reconcileUserQuota(userId);
      logger.info(`Quota reconciliation completed for user: ${userId || 'all'}`);
    } catch (error) {
      logger.error(`Quota reconciliation failed for user ${userId || 'all'}:`, error);
      throw error;
    }
  }

  private async processTrashCleanup(job: Job<TrashCleanupPayload>): Promise<{ deletedFiles: number; deletedFolders: number }> {
    logger.info('Starting old trash cleanup');
    
    try {
      const result = await this.api.cleanupOldTrash();
      logger.info(`Cleaned up ${result.deletedFiles} files and ${result.deletedFolders} folders from trash`);
      return result;
    } catch (error) {
      logger.error('Trash cleanup failed:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    await Promise.all([
      this.shareCleanupWorker.close(),
      this.reconcileWorker.close(),
      this.trashCleanupWorker.close(),
    ]);
  }
}
