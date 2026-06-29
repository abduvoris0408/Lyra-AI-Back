import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class AttachmentDto {
  /** MIME turi, masalan "image/png" yoki "application/pdf". */
  @IsString()
  mimeType!: string;

  /** base64 (prefiksiz) fayl ma'lumoti. */
  @IsString()
  data!: string;
}

export class ChatMessageDto {
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @IsString()
  content!: string;

  /** Biriktirilgan fayllar (rasm/PDF) — ixtiyoriy. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}

export class ChatRequestDto {
  /** Suhbat tarixi — oxirgi element yangi user xabari. */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages!: ChatMessageDto[];

  /** Model id (masalan "gemini-flash-latest"). Bo'sh bo'lsa standart ishlatiladi. */
  @IsOptional()
  @IsString()
  model?: string;

  /** Ixtiyoriy tizim ko'rsatmasi (system prompt). */
  @IsOptional()
  @IsString()
  system?: string;
}
