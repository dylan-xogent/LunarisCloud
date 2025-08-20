import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class UpdateFileDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsUUID()
  folderId?: string;
}
