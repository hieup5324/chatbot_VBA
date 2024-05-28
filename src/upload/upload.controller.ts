import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Get('readFolder')
  async readFilesInFolder(@Query('folderId') folderId: string) {
    return await this.uploadService.readFileInFolder(folderId);
  }
  // @Post()
  // @UseInterceptors(FileInterceptor('file'))
  // async uploadFile(@UploadedFile() file: Express.Multer.File) {
  //   return this.uploadService.handleFileUpload(file);
  // }
}
