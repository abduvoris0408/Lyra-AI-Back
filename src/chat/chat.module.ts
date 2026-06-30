import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { GeminiService } from './gemini.service';

@Module({
  imports: [AuthModule, ConversationsModule],
  controllers: [ChatController],
  providers: [ChatService, GeminiService],
})
export class ChatModule {}
