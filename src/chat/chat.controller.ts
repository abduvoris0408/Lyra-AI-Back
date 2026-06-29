import { Body, Controller, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './dto/chat-request.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  /**
   * POST /chat
   * Body: { messages: {role, content}[], model?, system? }
   * Javob: text/event-stream (SSE) — delta / done / error.
   *
   * @Res() ishlatilgani uchun NestJS javobni o'zi qaytarmaydi —
   * oqimni to'liq ChatService boshqaradi.
   */
  @Post()
  async stream(@Body() dto: ChatRequestDto, @Res() res: Response): Promise<void> {
    await this.chat.stream(dto, res);
  }
}
