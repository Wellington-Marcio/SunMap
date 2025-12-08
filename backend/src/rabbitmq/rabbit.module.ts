import { Global, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';

export class RabbitService implements OnModuleInit, OnModuleDestroy {
  private conn: amqp.Connection | null = null;

  async onModuleInit() {
    const rabbitUrl = process.env.RABBITMQ_URL || `amqp://${process.env.RABBITMQ_USER || 'guest'}:${process.env.RABBITMQ_PASS || 'guest'}@${process.env.RABBITMQ_HOST || 'rabbitmq'}:${process.env.RABBITMQ_PORT || '5672'}/`;
    try {
      const c = await amqp.connect(rabbitUrl);
      this.conn = c;
      try {
        (global as any).__amqp_conn = c;
      } catch (e) {}
    } catch (e) {
      this.conn = null;
    }
  }

  getConnection(): amqp.Connection | null {
    return this.conn;
  }

  async onModuleDestroy() {
    if (this.conn) {
      try {
        await this.conn.close();
      } catch (e) {
        // ignore
      }
    }
  }
}


@Global()
@Module({
  providers: [RabbitService],
  exports: [RabbitService],
})
export class RabbitModule {}
