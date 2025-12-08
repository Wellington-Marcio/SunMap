import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';

@Injectable()
export class WeatherPollerService implements OnModuleInit, OnModuleDestroy {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private readonly logger = new Logger(WeatherPollerService.name);

  onModuleInit() {
    // Simple stub poller: logs every 60 seconds. Replace with real polling later.
    this.intervalId = setInterval(() => {
      this.logger.debug('WeatherPoller tick');
    }, 60000);
  }

  onModuleDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId as unknown as number);
      this.intervalId = null;
    }
  }
}
