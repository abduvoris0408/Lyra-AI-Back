import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Global modul — PrismaService'ni butun ilovada import qilmasdan ishlatish mumkin.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
