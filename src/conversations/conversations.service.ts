import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Conversation, Message, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Suhbatlar va xabarlar — barchasi `userId` bo'yicha himoyalangan.
 * Boshqa foydalanuvchining suhbatiga kirib bo'lmaydi (ownership tekshiruvi).
 */
@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Foydalanuvchining suhbatlari (eng yangi birinchi), xabarlarsiz. */
  list(userId: string): Promise<Conversation[]> {
    return this.prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /** Bitta suhbat + xabarlari. Egasi bo'lmasa — 403/404. */
  async getWithMessages(
    userId: string,
    id: string,
  ): Promise<Conversation & { messages: Message[] }> {
    const conv = await this.prisma.conversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conv) throw new NotFoundException('Suhbat topilmadi.');
    if (conv.userId !== userId) throw new ForbiddenException();
    return conv;
  }

  create(
    userId: string,
    data: { title?: string; model?: string },
  ): Promise<Conversation> {
    return this.prisma.conversation.create({
      data: {
        userId,
        title: data.title?.trim() || 'Yangi suhbat',
        ...(data.model ? { model: data.model } : {}),
      },
    });
  }

  async rename(
    userId: string,
    id: string,
    title: string,
  ): Promise<Conversation> {
    await this.assertOwner(userId, id);
    return this.prisma.conversation.update({
      where: { id },
      data: { title: title.trim() || 'Yangi suhbat' },
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.assertOwner(userId, id);
    await this.prisma.conversation.delete({ where: { id } });
  }

  /** Xabar qo'shadi va suhbatning updatedAt'ini yangilaydi. */
  async addMessage(
    userId: string,
    conversationId: string,
    data: {
      role: Role;
      content: string;
      effort?: string;
      tokensIn?: number;
      tokensOut?: number;
    },
  ): Promise<Message> {
    await this.assertOwner(userId, conversationId);
    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: { conversationId, ...data },
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);
    return message;
  }

  /** Egalik tekshiruvi — yo'q bo'lsa 404, begona bo'lsa 403. */
  private async assertOwner(userId: string, id: string): Promise<void> {
    const conv = await this.prisma.conversation.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!conv) throw new NotFoundException('Suhbat topilmadi.');
    if (conv.userId !== userId) throw new ForbiddenException();
  }
}
