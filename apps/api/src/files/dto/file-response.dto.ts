export class FileResponseDto {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  s3Key: string;
  folderId?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  uploadId?: string;
  uploadStatus: 'pending' | 'completed' | 'failed';
}
