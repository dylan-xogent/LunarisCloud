import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserResponseDto, QuotaInfoDto } from './dto';
import { FREE_TIER_QUOTA_BYTES } from '@lunariscloud/types';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(userId: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async getQuotaInfo(userId: string): Promise<QuotaInfoDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const totalBytes = user.plan === 'PRO' 
      ? BigInt(100 * 1024 * 1024 * 1024) // 100GB for PRO
      : FREE_TIER_QUOTA_BYTES;

    const usedPercentage = Number((user.usedBytes * 100n) / totalBytes);

    return {
      usedBytes: user.usedBytes,
      totalBytes,
      usedPercentage,
      plan: user.plan,
    };
  }

  async updateProfile(userId: string, updates: { name?: string }): Promise<UserResponseDto> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updates,
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
