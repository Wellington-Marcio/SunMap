import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import mongoose from 'mongoose';
import * as amqp from 'amqplib';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): any {
    return this.appService.getHello();
  }

  @Get('health')
  async health() {
    const checks: any = {};

    // Estado da conexão com MongoDB / Mongoose
    try {
      const state = (mongoose as any)?.connection?.readyState;
      const stateMap: Record<number, string> = { 0: 'desconectado', 1: 'conectado', 2: 'conectando', 3: 'desconectando' };
      checks.mongodb = { estado: stateMap[state] ?? String(state), status: state === 1 ? 'ok' : 'degradado' };
    } catch (e) {
      checks.mongodb = { estado: 'erro', status: 'indisponivel', erro: String(e) };
    }

    // RabbitMQ quick connectivity check with timeout
    try {
      // Prefer a shared connection if the application exposed one on global scope
      const globalKeys = ['__amqp_conn', '__AMQP_CONN', '__rabbitConn', 'AMQP_CONN', 'rabbitConnection'];
      let existingConn: any = undefined;
      for (const k of globalKeys) {
        // @ts-ignore
        if ((global as any)[k]) { existingConn = (global as any)[k]; break; }
        // also check process namespace
        // @ts-ignore
        if ((process as any)[k]) { existingConn = (process as any)[k]; break; }
      }

      if (existingConn && typeof existingConn.createChannel === 'function') {
        // Use existing connection: open+close a channel (non-destructive and does not create a new TCP connection)
        try {
          const ch = await existingConn.createChannel();
          try { await ch.close(); } catch (ign) {}
          checks.rabbitmq = { status: 'ok', conexaoReutilizada: true };
        } catch (e) {
          checks.rabbitmq = { status: 'degradado', conexaoReutilizada: true, erro: String(e) };
        }
      } else {
        const rabbitUrl = process.env.RABBITMQ_URL || `amqp://${process.env.RABBITMQ_USER || 'guest'}:${process.env.RABBITMQ_PASS || 'guest'}@${process.env.RABBITMQ_HOST || 'rabbitmq'}:${process.env.RABBITMQ_PORT || '5672'}/`;
        const connPromise = amqp.connect(rabbitUrl);
        const conn: any = await Promise.race([
          connPromise,
          new Promise((_, rej) => setTimeout(() => rej(new Error('rabbitmq connect timeout')), 3000)),
        ]);
        try { await conn.close(); } catch (ign) {}
        checks.rabbitmq = { status: 'ok', conexaoReutilizada: false };
      }
    } catch (e) {
      checks.rabbitmq = { status: 'degradado', erro: String(e) };
    }

    const overallOk = (checks.mongodb?.status === 'ok' && checks.rabbitmq?.status === 'ok');
    const estadoGeral = overallOk ? 'operacional' : 'degradado';
    return {
      estado: estadoGeral,
      verificacoes: checks,
      tempoAtividade: process.uptime(),
      dataHora: new Date().toISOString(),
    };
  }
}
