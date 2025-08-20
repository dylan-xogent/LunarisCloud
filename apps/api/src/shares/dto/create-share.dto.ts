import { IsString, IsOptional, IsUUID, IsDateString, IsNumber, Min, Max } from 'class-validator';

export class CreateShareDto {
  @IsUUID()
  fileId?: string;

  @IsUUID()
  folderId?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  maxDownloads?: number;
}
