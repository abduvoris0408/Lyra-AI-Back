import { IsOptional, IsString } from 'class-validator';

export class GoogleLoginDto {
  /** Google ID token (GIS credential) — afzal ko'riladi. */
  @IsOptional()
  @IsString()
  credential?: string;

  /** Google OAuth access token (GIS token oqimi). */
  @IsOptional()
  @IsString()
  accessToken?: string;
}
