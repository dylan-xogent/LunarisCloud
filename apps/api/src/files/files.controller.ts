import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { UpdateFileDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload/initiate')
  initiateUpload(
    @Request() req,
    @Body() body: { folderId?: string; name: string; size: number; mimeType: string },
  ) {
    return this.filesService.initiateUpload(req.user.id, body.folderId || null, body.name, body.size, body.mimeType);
  }

  @Post('upload/complete')
  completeUpload(
    @Request() req,
    @Body() body: { uploadId: string; etag: string },
  ) {
    return this.filesService.completeUpload(req.user.id, body.uploadId, body.etag);
  }

  @Get()
  getFiles(
    @Request() req,
    @Query('folderId') folderId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.filesService.getFiles(req.user.id, folderId || null, page, limit);
  }

  @Get(':id')
  getFile(@Request() req, @Param('id') id: string) {
    return this.filesService.getFile(req.user.id, id);
  }

  @Patch(':id')
  updateFile(@Request() req, @Param('id') id: string, @Body() updateFileDto: UpdateFileDto) {
    return this.filesService.updateFile(req.user.id, id, updateFileDto);
  }

  @Delete(':id')
  deleteFile(@Request() req, @Param('id') id: string) {
    return this.filesService.deleteFile(req.user.id, id);
  }

  @Get(':id/download')
  getDownloadUrl(@Request() req, @Param('id') id: string) {
    return this.filesService.getDownloadUrl(req.user.id, id);
  }

  @Get('trash')
  getTrash(
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.filesService.getTrash(req.user.id, page, limit);
  }

  @Post('trash/empty')
  emptyTrash(@Request() req) {
    return this.filesService.emptyTrash(req.user.id);
  }

  @Post('trash/:id/restore')
  restoreFile(@Request() req, @Param('id') id: string) {
    return this.filesService.restoreFile(req.user.id, id);
  }

  @Post('reconcile')
  reconcileUsedBytes(@Request() req) {
    return this.filesService.reconcileUsedBytes(req.user.id);
  }
}
