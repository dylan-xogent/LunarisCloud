import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Public,
} from '@nestjs/common';
import { SharesService } from './shares.service';
import { CreateShareDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public as PublicDecorator } from '../auth/decorators/public.decorator';

@Controller('shares')
export class SharesController {
  constructor(private readonly sharesService: SharesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req, @Body() createShareDto: CreateShareDto) {
    return this.sharesService.create(req.user.id, createShareDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  getUserShares(@Request() req) {
    return this.sharesService.getUserShares(req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deleteShare(@Request() req, @Param('id') id: string) {
    return this.sharesService.deleteShare(req.user.id, id);
  }

  @Get('s/:id')
  @PublicDecorator()
  getPublicShare(@Param('id') id: string) {
    return this.sharesService.getPublicShare(id);
  }

  @Post('s/:id/validate')
  @PublicDecorator()
  validatePassword(@Param('id') id: string, @Body() body: { password: string }) {
    return this.sharesService.validatePassword(id, body.password);
  }

  @Post('s/:id/download')
  @PublicDecorator()
  async downloadFromShare(@Param('id') id: string) {
    await this.sharesService.incrementDownloadCount(id);
    return { message: 'Download count incremented' };
  }
}
