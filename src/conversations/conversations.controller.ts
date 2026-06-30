import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConversationsService } from './conversations.service';
import {
  CreateConversationDto,
  RenameConversationDto,
} from './dto/conversation.dto';

/**
 * /conversations — barcha endpointlar autentifikatsiya talab qiladi.
 * Foydalanuvchi faqat o'z suhbatlarini ko'radi va boshqaradi.
 */
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Get()
  list(@CurrentUser() userId: string) {
    return this.conversations.list(userId);
  }

  @Post()
  create(
    @CurrentUser() userId: string,
    @Body() dto: CreateConversationDto,
  ) {
    return this.conversations.create(userId, dto);
  }

  @Get(':id')
  getOne(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.conversations.getWithMessages(userId, id);
  }

  @Patch(':id')
  rename(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() dto: RenameConversationDto,
  ) {
    return this.conversations.rename(userId, id, dto.title);
  }

  @Delete(':id')
  async remove(@CurrentUser() userId: string, @Param('id') id: string) {
    await this.conversations.remove(userId, id);
    return { ok: true };
  }
}
