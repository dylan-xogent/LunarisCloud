import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  database: {
    status: 'connected' | 'disconnected';
    responseTime?: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

@Injectable()
export class HealthService {
  constructor(private prisma: PrismaService) {}

  async getHealthStatus(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    // Check database connectivity
    let dbStatus: 'connected' | 'disconnected' = 'disconnected';
    let dbResponseTime: number | undefined;
    
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
      dbResponseTime = Date.now() - startTime;
    } catch (error) {
      dbStatus = 'disconnected';
    }

    // Get memory usage
    const memUsage = process.memoryUsage();
    const usedMemory = memUsage.heapUsed;
    const totalMemory = memUsage.heapTotal;
    const memoryPercentage = (usedMemory / totalMemory) * 100;

    const overallStatus = dbStatus === 'connected' ? 'healthy' : 'unhealthy';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: dbStatus,
        responseTime: dbResponseTime,
      },
      memory: {
        used: usedMemory,
        total: totalMemory,
        percentage: memoryPercentage,
      },
    };
  }

  async getDetailedHealth(): Promise<HealthStatus & { details: any }> {
    const basicHealth = await this.getHealthStatus();
    
    // Add additional health checks here
    const details = {
      version: process.env.npm_package_version || '1.0.0',
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    };

    return {
      ...basicHealth,
      details,
    };
  }
}
