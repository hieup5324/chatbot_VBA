import { Module } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { ReadFileService } from './read-file.service';

@Module({
  providers: [ChatbotService, ReadFileService],
  controllers: [ChatbotController],
})
export class ChatbotModule {}
