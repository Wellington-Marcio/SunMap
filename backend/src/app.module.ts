import { Module, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { ApiController } from './api.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { WeatherModule } from './weather/weather.module';
import { RabbitModule } from './rabbitmq/rabbit.module';

function buildMongoUri(): string {
  if (process.env.MONGO_URI && process.env.MONGO_URI.length > 0) {
    return process.env.MONGO_URI;
  }

  const host = process.env.MONGO_HOST || 'localhost';
  const port = process.env.MONGO_PORT || '27017';
  const db = process.env.MONGO_DB || 'sunmap';
  const user = process.env.MONGO_USER;
  const pass = process.env.MONGO_PASS;

  if (user && pass) {
    return `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${db}?authSource=admin`;
  }

  return `mongodb://${host}:${port}/${db}`;
}

const logger = new Logger('AppModule');
const mongoUri = buildMongoUri();
logger.log(`Using MongoDB URI: ${mongoUri.replace(/(^mongodb:\/\/)(?:.*@)?/, '$1<REDACTED>@')}`);

@Module({
  imports: [
    MongooseModule.forRoot(mongoUri),
    RabbitModule,
    UsersModule,
    AuthModule,
    WeatherModule,
  ],
  controllers: [AppController, ApiController],
  providers: [AppService],
})
export class AppModule {}
