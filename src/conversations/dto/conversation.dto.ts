import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateConversationDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  model?: string;
}

export class RenameConversationDto {
  @IsString()
  @MaxLength(200)
  title!: string;
}
