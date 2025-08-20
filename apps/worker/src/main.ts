import 'dotenv/config';
import { validateEnv } from './config/env';
import { ClamAVService } from './services/clamav.service';
import { ApiService } from './services/api.service';
import { VirusScanQueue } from './queues/virus-scan.queue';
import { CleanupQueue } from './queues/cleanup.queue';
import { logger } from './utils/logger';

async function main() {
  try {
    // Validate environment variables
    const env = validateEnv();
    logger.info('Environment validation passed');

    // Initialize services
    const clamav = new ClamAVService(env);
    const api = new ApiService(env);

    // Test ClamAV connection
    const clamavAvailable = await clamav.ping();
    if (!clamavAvailable) {
      logger.warn('ClamAV is not available - virus scanning will fail');
    } else {
      logger.info('ClamAV connection successful');
    }

    // Initialize queues
    const virusScanQueue = new VirusScanQueue(
      env.REDIS_URL,
      clamav,
      api,
      env.WORKER_CONCURRENCY
    );

    const cleanupQueue = new CleanupQueue(env.REDIS_URL, api);

    logger.info(`Worker started with concurrency: ${env.WORKER_CONCURRENCY}`);

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      
      try {
        await Promise.all([
          virusScanQueue.close(),
          cleanupQueue.close(),
        ]);
        
        logger.info('Worker shutdown complete');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Health check endpoint
    if (process.env.HEALTH_CHECK_PORT) {
      const http = require('http');
      const server = http.createServer((req: any, res: any) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }));
      });
      
      server.listen(process.env.HEALTH_CHECK_PORT, () => {
        logger.info(`Health check endpoint listening on port ${process.env.HEALTH_CHECK_PORT}`);
      });
    }

  } catch (error) {
    logger.error('Failed to start worker:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error('Unhandled error in main:', error);
  process.exit(1);
});
