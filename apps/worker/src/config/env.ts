import { z } from 'zod';

const envSchema = z.object({
  // Redis
  REDIS_URL: z.string().url(),
  
  // API
  API_URL: z.string().url(),
  API_SECRET: z.string().min(32),
  
  // ClamAV
  CLAMAV_HOST: z.string().default('localhost'),
  CLAMAV_PORT: z.string().transform(Number).default('3310'),
  
  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  
  // Worker
  WORKER_CONCURRENCY: z.string().transform(Number).default('5'),
  WORKER_PREFIX: z.string().default('lunariscloud'),
});

export type WorkerEnv = z.infer<typeof envSchema>;

export function validateEnv(): WorkerEnv {
  return envSchema.parse(process.env);
}
