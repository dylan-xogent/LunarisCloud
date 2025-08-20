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
import { FoldersService } from './folders.service';
import { CreateFolderDto, UpdateFolderDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('folders')
@UseGuards(JwtAuthGuard)
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Post()
  create(@Request() req, @Body() createFolderDto: CreateFolderDto) {
    return this.foldersService.create(req.user.id, createFolderDto);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.foldersService.findOne(req.user.id, id);
  }

  @Get(':id/children')
  findChildren(
    @Request() req,
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.foldersService.findChildren(req.user.id, id, page, limit);
  }

  @Get(':id/breadcrumbs')
  getBreadcrumbs(@Request() req, @Param('id') id: string) {
    return this.foldersService.getBreadcrumbs(req.user.id, id);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() updateFolderDto: UpdateFolderDto) {
    return this.foldersService.update(req.user.id, id, updateFolderDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.foldersService.remove(req.user.id, id);
  }
}
