export class UserResponseDto {
  id: string;
  email: string;
  name?: string;
  plan: 'FREE' | 'PRO';
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
