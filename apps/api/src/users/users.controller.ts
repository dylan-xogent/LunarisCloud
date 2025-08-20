import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  getProfile(@Request() req) {
    return this.usersService.findOne(req.user.id);
  }

  @Get('quota')
  getQuotaInfo(@Request() req) {
    return this.usersService.getQuotaInfo(req.user.id);
  }

  @Patch('profile')
  updateProfile(@Request() req, @Body() updates: { name?: string }) {
    return this.usersService.updateProfile(req.user.id, updates);
  }
}
