import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Ensure default admin user if configured
  try {
    const usersService = app.get(UsersService);
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL ?? 'admin@sunmap.com';
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD ?? '123456';
    await usersService.ensureDefaultAdmin(adminEmail, adminPassword);
  } catch (err) {
    // no-op if users service not available yet
  }
  // enable global validation pipe for DTOs
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  // enable CORS so frontend (Vite dev server) can call API
  app.enableCors();

  // Listen with a safe fallback when port is in use. To enable automatic
  // fallback, set `PORT_FALLBACK=true` (it will try PORT, PORT+1, PORT+2).
  const envPort = process.env.PORT ? Number(process.env.PORT) : 3001;
  const fallbackEnabled = String(process.env.PORT_FALLBACK || '').toLowerCase() === 'true';
  const portsToTry = fallbackEnabled ? [envPort, envPort + 1, envPort + 2] : [envPort];

  for (let i = 0; i < portsToTry.length; i++) {
    const p = portsToTry[i];
    try {
      // attempt to listen on port p
      // if successful, break the loop and keep running
      // Nest throws on listen errors (eg. EADDRINUSE)
      // so we catch and try the next candidate port when appropriate
      // eslint-disable-next-line no-await-in-loop
      await app.listen(p);
      // eslint-disable-next-line no-console
      console.log(`Listening on port ${p}`);
      break;
    } catch (err: any) {
      if (err && err.code === 'EADDRINUSE') {
        // eslint-disable-next-line no-console
        console.warn(`Port ${p} already in use.`);
        if (i === portsToTry.length - 1) {
          // last attempt — rethrow so the process exits with an error
          throw err;
        }
        // otherwise continue to next candidate
        // eslint-disable-next-line no-continue
        continue;
      }
      // unknown error — rethrow
      throw err;
    }
  }
}
bootstrap();
