import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ReadFileService } from './read-file.service';

@Controller('chatbot')
export class ChatbotController {
  constructor(
    private readonly chatbotService: ChatbotService,
    private readonly readFileService: ReadFileService,
  ) {}

  @Get('read-folder')
  readFilesInFolder(@Query('folderId') folderId: string) {
    return this.readFileService.readFileInFolder(folderId);
  }

  @Post('send-message')
  sendNotifyToTelegram() {
    return this.chatbotService.sendNotifyToTelegram();
  }
}
