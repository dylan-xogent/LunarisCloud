import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';
import { CreateUserDto, LoginDto } from './dto';
import { AuthUser } from '@/types';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const { email, password } = createUserDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        emailVerified: false,
        usedBytes: 0n,
        plan: 'FREE',
      },
    });

    // Send verification email
    await this.emailService.sendVerificationEmail(user.email, user.id);

    return {
      message: 'User registered successfully. Please check your email for verification.',
      userId: user.id,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    const payload = { email: user.email, sub: user.id };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        usedBytes: user.usedBytes,
        plan: user.plan,
      },
    };
  }

  async validateUser(email: string, password: string): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      return {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        usedBytes: user.usedBytes,
        plan: user.plan,
      };
    }

    return null;
  }

  async verifyEmail(token: string) {
    const verification = await this.prisma.emailVerification.findUnique({
      where: { token },
    });

    if (!verification) {
      throw new UnauthorizedException('Invalid verification token');
    }

    if (verification.expiresAt < new Date()) {
      throw new UnauthorizedException('Verification token has expired');
    }

    // Update user email verification status
    await this.prisma.user.update({
      where: { email: verification.email },
      data: { emailVerified: true },
    });

    // Delete verification token
    await this.prisma.emailVerification.delete({
      where: { id: verification.id },
    });

    return { message: 'Email verified successfully' };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.emailVerified) {
      throw new ConflictException('Email is already verified');
    }

    await this.emailService.sendVerificationEmail(user.email, user.id);

    return { message: 'Verification email sent successfully' };
  }
}
