import { Controller, Get, Post, Body } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { Weather } from './schemas/weather.schema';

@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get()
  async getAll(): Promise<Weather[]> {
    return this.weatherService.findAll();
  }

  @Post()
  async create(@Body() body: Partial<Weather>): Promise<Weather> {
    return this.weatherService.create(body);
  }
}
