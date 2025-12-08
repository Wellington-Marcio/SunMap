import { Controller, Get } from '@nestjs/common';

@Controller('api')
export class ApiController {
  @Get()
  health() {
    return { status: 'ok', message: 'SunMap API is running' };
  }
}
