import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { config } from 'dotenv';
import { ChatbotModule } from './chatbot/chatbot.module';
config();

@Module({
  imports: [ChatbotModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
