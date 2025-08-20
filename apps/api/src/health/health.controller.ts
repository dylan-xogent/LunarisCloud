import { Controller, Get, UseGuards } from '@nestjs/common';
import { HealthService } from './health.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Public()
  getHealth() {
    return this.healthService.getHealthStatus();
  }

  @Get('detailed')
  @UseGuards(JwtAuthGuard)
  getDetailedHealth() {
    return this.healthService.getDetailedHealth();
  }

  @Get('metrics')
  @Public()
  getMetrics() {
    // Basic metrics endpoint - in production, you'd use Prometheus
    const memUsage = process.memoryUsage();
    
    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss,
      },
      cpu: {
        usage: process.cpuUsage(),
      },
    };
  }
}
