import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './dto/chat-request.dto';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  /**
   * POST /chat  (autentifikatsiya talab qilinadi)
   * Body: { messages, model?, system?, conversationId?, effort? }
   * Javob: text/event-stream (SSE) — delta / done / error.
   *
   * @Res() ishlatilgani uchun NestJS javobni o'zi qaytarmaydi —
   * oqimni to'liq ChatService boshqaradi.
   */
  @Post()
  async stream(
    @Body() dto: ChatRequestDto,
    @CurrentUser() userId: string,
    @Res() res: Response,
  ): Promise<void> {
    await this.chat.stream(dto, userId, res);
  }
}
