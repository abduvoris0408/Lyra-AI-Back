import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  /** Sog'liqni tekshirish — server ishlayotganini bilish uchun. */
  @Get('health')
  health() {
    return { status: 'ok', service: 'lyra-api', time: new Date().toISOString() };
  }
}
