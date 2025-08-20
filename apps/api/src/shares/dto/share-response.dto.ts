export class ShareResponseDto {
  id: string;
  fileId?: string;
  folderId?: string;
  userId: string;
  password?: string;
  expiresAt?: Date;
  maxDownloads?: number;
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
  file?: any;
  folder?: any;
}
