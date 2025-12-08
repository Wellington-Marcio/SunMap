import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WeatherService } from './weather.service';
import { WeatherController } from './weather.controller';
import { Weather, WeatherSchema } from './schemas/weather.schema';
import { WeatherPollerService } from './weather.poller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Weather.name, schema: WeatherSchema }])],
  providers: [WeatherService, WeatherPollerService],
  controllers: [WeatherController],
  exports: [WeatherService],
})
export class WeatherModule {}
