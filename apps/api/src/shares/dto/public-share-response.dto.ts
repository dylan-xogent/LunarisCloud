export class PublicShareResponseDto {
  id: string;
  fileId?: string;
  folderId?: string;
  requiresPassword: boolean;
  expiresAt?: Date;
  maxDownloads?: number;
  downloadCount: number;
  file?: any;
  folder?: any;
}
