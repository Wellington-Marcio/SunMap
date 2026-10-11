import { Module } from '@nestjs/common';
import { WeatherController } from './weather/weather.controller';
import { WeatherService } from './weather/weather.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';

@Module({
  imports: [],
  controllers: [WeatherController, AuthController],
  providers: [WeatherService, AuthService],
})
export class AppModule {}
