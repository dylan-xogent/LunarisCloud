import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { FREE_TIER_QUOTA_BYTES, MAX_FILE_SIZE, MIN_PART_SIZE } from '@/types';

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private bucket: string;

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      endpoint: this.configService.get('S3_ENDPOINT'),
      region: this.configService.get('S3_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: this.configService.get('S3_ACCESS_KEY'),
        secretAccessKey: this.configService.get('S3_SECRET_KEY'),
      },
      forcePathStyle: true, // Required for MinIO
    });
    this.bucket = this.configService.get('S3_BUCKET', 'userfiles');
  }

  async createMultipartUpload(key: string, contentType: string) {
    const command = new CreateMultipartUploadCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const result = await this.s3Client.send(command);
    return result.UploadId;
  }

  async getUploadPartUrl(key: string, uploadId: string, partNumber: number) {
    const command = new UploadPartCommand({
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn: 3600 }); // 1 hour
  }

  async completeMultipartUpload(key: string, uploadId: string, parts: Array<{ ETag: string; PartNumber: number }>) {
    const command = new CompleteMultipartUploadCommand({
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    });

    const result = await this.s3Client.send(command);
    return result.ETag;
  }

  async abortMultipartUpload(key: string, uploadId: string) {
    const command = new AbortMultipartUploadCommand({
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId,
    });

    await this.s3Client.send(command);
  }

  async getDownloadUrl(key: string, expiresIn: number = 3600) {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async uploadFile(key: string, body: Buffer, contentType: string) {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    const result = await this.s3Client.send(command);
    return result.ETag;
  }

  async deleteFile(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  calculatePartSize(fileSize: number): number {
    if (fileSize <= MIN_PART_SIZE) {
      return fileSize;
    }

    // Calculate optimal part size (between 5MB and 5GB)
    let partSize = Math.ceil(fileSize / 10000); // Start with 10,000 parts max
    partSize = Math.max(partSize, MIN_PART_SIZE);
    partSize = Math.min(partSize, 5 * 1024 * 1024 * 1024); // 5GB max

    return partSize;
  }

  calculateParts(fileSize: number): Array<{ partNumber: number; start: number; end: number }> {
    const partSize = this.calculatePartSize(fileSize);
    const parts = [];

    for (let i = 0; i < Math.ceil(fileSize / partSize); i++) {
      const start = i * partSize;
      const end = Math.min(start + partSize - 1, fileSize - 1);
      parts.push({
        partNumber: i + 1,
        start,
        end,
      });
    }

    return parts;
  }

  generateS3Key(userId: string, fileName: string): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')) : '';
    const nameWithoutExt = fileName.includes('.') ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName;
    
    return `${userId}/${timestamp}-${randomId}${extension}`;
  }
}
