import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // attach standard parsers
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  // Enable CORS for development: allow all origins so Vite dev server can call the API.
  // In production you should restrict this to trusted origins and use BACKEND_CORS_ORIGINS.
  app.enableCors({
    origin: true, // reflect request origin — permissive for dev
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    credentials: true,
  });


  // (No debug middleware) keep middleware minimal in production-ready code.

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);
  // small log so Docker logs show it's running
  // eslint-disable-next-line no-console
  console.log(`Backend listening on port ${port}`);
}

bootstrap();
