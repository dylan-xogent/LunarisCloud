export class FolderResponseDto {
  id: string;
  name: string;
  parentId?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  _count?: {
    children: number;
    files: number;
  };
}
