import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // .env, keyin .env.local (mahalliy override) o'qiladi
      envFilePath: ['.env.local', '.env'],
    }),
    ChatModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
