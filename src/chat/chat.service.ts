import { Injectable, Logger } from '@nestjs/common';
import type { Response } from 'express';
import type { ChatRequestDto } from './dto/chat-request.dto';
import {
  GeminiService,
  type GeminiContent,
  type GeminiPart,
} from './gemini.service';

/**
 * Chat oqimini boshqaradi: frontend xabarlarini Gemini formatiga o'giradi,
 * Gemini SSE oqimini o'qiydi va frontend kutgan formatga qayta uzatadi:
 *   data: {"delta":"..."}\n\n
 *   data: {"done":true}\n\n
 *   data: {"error":"..."}\n\n
 */
@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly gemini: GeminiService) {}

  async stream(dto: ChatRequestDto, res: Response): Promise<void> {
    // SSE sarlavhalari
    res.set({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders?.();

    const send = (data: unknown) => res.write(`data: ${JSON.stringify(data)}\n\n`);
    const fail = (message: string) => {
      send({ error: message });
      send({ done: true });
      res.end();
    };

    if (!this.gemini.apiKey) {
      return fail(
        "GEMINI_API_KEY sozlanmagan. lyra-api/.env fayliga AI Studio kalitini qo'shing.",
      );
    }

    const contents: GeminiContent[] = (dto.messages ?? [])
      .filter((m) => m.content?.trim() || (m.attachments?.length ?? 0) > 0)
      .map((m) => {
        const parts: GeminiPart[] = [];
        if (m.content?.trim()) parts.push({ text: m.content });
        for (const a of m.attachments ?? []) {
          if (a.data && a.mimeType) {
            parts.push({ inlineData: { mimeType: a.mimeType, data: a.data } });
          }
        }
        return {
          role: m.role === 'assistant' ? 'model' : 'user',
          parts,
        } satisfies GeminiContent;
      });

    if (contents.length === 0) {
      return fail("Yuborish uchun xabar yo'q.");
    }

    // Klient ulanishni uzsa — upstream so'rovni ham bekor qilamiz
    const controller = new AbortController();
    res.on('close', () => controller.abort());

    const primaryModel = dto.model || this.gemini.defaultModel;
    const fallbackModel = this.gemini.fallbackModel;

    let upstream: globalThis.Response;
    try {
      upstream = await this.gemini.streamGenerateContent({
        contents,
        model: primaryModel,
        system: dto.system,
        signal: controller.signal,
      });

      // Model band (503) yoki bepul kvota tugagan (429) bo'lsa —
      // ishonchli bepul modelga avtomatik o'tamiz.
      if (
        (upstream.status === 503 || upstream.status === 429) &&
        primaryModel !== fallbackModel
      ) {
        this.logger.warn(
          `"${primaryModel}" ${upstream.status} qaytardi — "${fallbackModel}" ga o'tilyapti`,
        );
        await this.discard(upstream);
        upstream = await this.gemini.streamGenerateContent({
          contents,
          model: fallbackModel,
          system: dto.system,
          signal: controller.signal,
        });
      }
    } catch (err) {
      this.logger.error(`Gemini ulanish xatosi: ${(err as Error)?.message}`);
      return fail("Gemini'ga ulanib bo'lmadi.");
    }

    if (!upstream.ok || !upstream.body) {
      const detail = await this.safeText(upstream);
      this.logger.warn(`Gemini ${upstream.status}: ${detail}`);
      return fail(`Gemini xatosi (${upstream.status}): ${detail}`);
    }

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        // Gemini event'larni CRLF (\r\n\r\n) bilan ajratadi — \n\n va \r\n\r\n ikkalasini ham qo'llab-quvvatlaymiz
        const events = buffer.split(/\r?\n\r?\n/);
        buffer = events.pop() ?? '';

        for (const event of events) {
          const line = event
            .split(/\r?\n/)
            .find((l) => l.startsWith('data:'));
          if (!line) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === '[DONE]') continue;

          const text = this.gemini.extractText(payload);
          if (text) send({ delta: text });
        }
      }
      send({ done: true });
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        send({ error: (err as Error)?.message ?? 'Oqim uzildi' });
        send({ done: true });
      }
    } finally {
      reader.releaseLock();
      res.end();
    }
  }

  /** Ishlatilmaydigan javob tanasini yopadi (resurs sizib chiqmasligi uchun). */
  private async discard(res: globalThis.Response): Promise<void> {
    try {
      await res.body?.cancel();
    } catch {
      /* e'tiborsiz */
    }
  }

  private async safeText(res: globalThis.Response): Promise<string> {
    try {
      const text = await res.text();
      // Gemini xato JSON'idan o'qiluvchi xabarni ajratib olishga harakat
      try {
        const parsed = JSON.parse(text) as { error?: { message?: string } };
        if (parsed.error?.message) return parsed.error.message.slice(0, 300);
      } catch {
        /* JSON emas — xom matnni qaytaramiz */
      }
      return text.slice(0, 300);
    } catch {
      return "noma'lum xato";
    }
  }
}
