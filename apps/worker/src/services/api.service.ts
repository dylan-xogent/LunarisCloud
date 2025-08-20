import axios, { AxiosInstance } from 'axios';
import { WorkerEnv } from '../config/env';

export interface VirusScanPayload {
  userId: string;
  fileId: string;
  s3Key: string;
  sizeBytes: number;
}

export interface ScanResult {
  isInfected: boolean;
  virusName?: string;
  scanTime: number;
}

export class ApiService {
  private client: AxiosInstance;

  constructor(env: WorkerEnv) {
    this.client = axios.create({
      baseURL: env.API_URL,
      headers: {
        'Authorization': `Bearer ${env.API_SECRET}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async updateFileScanStatus(fileId: string, scanResult: ScanResult): Promise<void> {
    await this.client.post(`/internal/files/${fileId}/scan-result`, {
      isInfected: scanResult.isInfected,
      virusName: scanResult.virusName,
      scanTime: scanResult.scanTime,
    });
  }

  async getFileDownloadUrl(s3Key: string): Promise<string> {
    const response = await this.client.get(`/internal/files/download-url`, {
      params: { s3Key },
    });
    return response.data.downloadUrl;
  }

  async cleanupExpiredShares(): Promise<number> {
    const response = await this.client.post('/internal/shares/cleanup-expired');
    return response.data.deletedCount;
  }

  async reconcileUserQuota(userId?: string): Promise<void> {
    const endpoint = userId 
      ? `/internal/users/${userId}/reconcile-quota`
      : '/internal/users/reconcile-all-quotas';
    
    await this.client.post(endpoint);
  }

  async cleanupOldTrash(): Promise<{ deletedFiles: number; deletedFolders: number }> {
    const response = await this.client.post('/internal/trash/cleanup-old');
    return response.data;
  }
}
