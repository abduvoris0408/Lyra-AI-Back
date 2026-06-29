import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

export interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

/**
 * Google AI Studio (Generative Language API) bilan ishlovchi servis.
 *
 * MUHIM: bu BEPUL tarif (Free Tier) — billing/karta SHART EMAS.
 * Kalit https://aistudio.google.com/apikey dan olinadi ("AIza..." ko'rinishida).
 * Kalit faqat serverda (.env) saqlanadi, brauzerga hech qachon chiqmaydi.
 */
@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);

  constructor(private readonly config: ConfigService) {}

  get apiKey(): string {
    return this.config.get<string>('GEMINI_API_KEY') ?? '';
  }

  get baseUrl(): string {
    return (
      this.config.get<string>('GEMINI_API_URL') ??
      'https://generativelanguage.googleapis.com/v1beta'
    );
  }

  get defaultModel(): string {
    return (
      this.config.get<string>('GEMINI_DEFAULT_MODEL') ?? 'gemini-flash-latest'
    );
  }

  /**
   * Asosiy model band (503) yoki kvotasi tugagan (429) bo'lsa o'tiladigan
   * ishonchli bepul model. Free tier'da eng barqaror ishlaydi.
   */
  get fallbackModel(): string {
    return (
      this.config.get<string>('GEMINI_FALLBACK_MODEL') ??
      'gemini-flash-lite-latest'
    );
  }

  /**
   * Gemini'dan SSE oqimini (streamGenerateContent) so'raydi va xom
   * upstream `Response`'ni qaytaradi. Oqimni o'qish ChatService zimmasida.
   */
  async streamGenerateContent(params: {
    contents: GeminiContent[];
    model?: string;
    system?: string;
    signal?: AbortSignal;
  }): Promise<Response> {
    const model = params.model || this.defaultModel;
    const url = `${this.baseUrl}/models/${model}:streamGenerateContent?alt=sse`;

    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Kalitni URL o'rniga header orqali yuborish (loglarga tushmaydi)
        'x-goog-api-key': this.apiKey,
      },
      body: JSON.stringify({
        contents: params.contents,
        ...(params.system
          ? { systemInstruction: { parts: [{ text: params.system }] } }
          : {}),
      }),
      signal: params.signal,
    });
  }

  /** Gemini chunk JSON'idan matnni ajratadi. */
  extractText(payload: string): string {
    try {
      const data = JSON.parse(payload) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const parts = data.candidates?.[0]?.content?.parts ?? [];
      return parts.map((p) => p.text ?? '').join('');
    } catch {
      return '';
    }
  }
}
