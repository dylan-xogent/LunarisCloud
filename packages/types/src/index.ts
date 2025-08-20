// User and Authentication Types
export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
  usedBytes: bigint;
  plan: Plan;
}

export enum Plan {
  FREE = 'FREE',
  PRO = 'PRO'
}

export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  usedBytes: bigint;
  plan: Plan;
}

// File and Folder Types
export interface File {
  id: string;
  ownerId: string;
  folderId?: string;
  name: string;
  sizeBytes: bigint;
  mime: string;
  etag: string;
  s3Key: string;
  version: number;
  trashedAt?: Date;
  createdAt: Date;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  ownerId: string;
  createdAt: Date;
}

export interface FileWithFolder extends File {
  folder?: Folder;
}

export interface FolderWithChildren extends Folder {
  children: Folder[];
  files: File[];
}

// Share Types
export interface Share {
  id: string;
  ownerId: string;
  fileId?: string;
  folderId?: string;
  passwordHash?: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface CreateShareRequest {
  fileId?: string;
  folderId?: string;
  expiresIn: number; // seconds
  password?: string;
}

// Upload Types
export interface InitiateUploadRequest {
  folderId?: string;
  name: string;
  sizeBytes: number;
  mime: string;
}

export interface InitiateUploadResponse {
  uploadId: string;
  parts: Array<{
    partNumber: number;
    presignedUrl: string;
  }>;
  s3Key: string;
}

export interface CompleteUploadRequest {
  uploadId: string;
  etag: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Quota Types
export interface QuotaInfo {
  usedBytes: bigint;
  quotaBytes: bigint;
  usedPercentage: number;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  userId?: string;
  ip?: string;
  action: string;
  targetId?: string;
  meta?: Record<string, any>;
  createdAt: Date;
}

// Health and Metrics Types
export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    database: boolean;
    redis: boolean;
    s3: boolean;
  };
}

export interface Metrics {
  totalUsers: number;
  totalFiles: number;
  totalStorageUsed: bigint;
  uploadsToday: number;
  downloadsToday: number;
}

// Error Types
export class LunarisError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'LunarisError';
  }
}

export class QuotaExceededError extends LunarisError {
  constructor(message: string = 'Storage quota exceeded') {
    super(message, 413, 'QUOTA_EXCEEDED');
    this.name = 'QuotaExceededError';
  }
}

export class FileNotFoundError extends LunarisError {
  constructor(message: string = 'File not found') {
    super(message, 404, 'FILE_NOT_FOUND');
    this.name = 'FileNotFoundError';
  }
}

export class UnauthorizedError extends LunarisError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

// Constants
export const FREE_TIER_QUOTA_BYTES = 15 * 1024 * 1024 * 1024; // 15 GB
export const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5 GB per file
export const MAX_UPLOAD_PARTS = 10000; // S3 multipart limit
export const MIN_PART_SIZE = 5 * 1024 * 1024; // 5 MB minimum part size
