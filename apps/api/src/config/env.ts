import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  
  // Redis
  REDIS_URL: z.string().url(),
  
  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  API_URL: z.string().url(),
  WEB_URL: z.string().url(),
  
  // S3/MinIO
  S3_ENDPOINT: z.string().url(),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),
  S3_BUCKET: z.string(),
  S3_REGION: z.string().default('us-east-1'),
  S3_FORCE_PATH_STYLE: z.string().transform(val => val === 'true').default('true'),
  
  // SMTP
  SMTP_HOST: z.string(),
  SMTP_PORT: z.string().transform(Number),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  SMTP_FROM: z.string().email(),
  
  // Admin
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  
  // Quota
  FREE_TIER_QUOTA_BYTES: z.string().transform(val => BigInt(val)).default('16106127360'), // 15GB
  
  // Worker
  API_SECRET: z.string().min(32),
  
  // Rate Limiting
  RATE_LIMIT_AUTH: z.string().transform(Number).default('5'),
  RATE_LIMIT_UPLOAD: z.string().transform(Number).default('60'),
  RATE_LIMIT_DOWNLOAD: z.string().transform(Number).default('120'),
  RATE_LIMIT_ADMIN: z.string().transform(Number).default('30'),
  
  // File Upload
  MAX_FILE_SIZE_BYTES: z.string().transform(val => BigInt(val)).default('5368709120'), // 5GB
  MAX_FILE_SIZE_MB: z.string().transform(Number).default('5120'), // 5GB in MB
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  const env = envSchema.parse(process.env);
  
  // Additional validation
  if (env.ADMIN_EMAIL && !env.ADMIN_PASSWORD) {
    throw new Error('ADMIN_PASSWORD is required when ADMIN_EMAIL is provided');
  }
  
  if (env.ADMIN_PASSWORD && !env.ADMIN_EMAIL) {
    throw new Error('ADMIN_EMAIL is required when ADMIN_PASSWORD is provided');
  }
  
  return env;
}
