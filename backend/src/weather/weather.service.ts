import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Weather, WeatherDocument } from './schemas/weather.schema';

@Injectable()
export class WeatherService {
  constructor(@InjectModel(Weather.name) private weatherModel: Model<WeatherDocument>) {}

  async create(data: Partial<Weather>): Promise<Weather> {
    const created = new this.weatherModel(data);
    return created.save();
  }

  async findAll(): Promise<Weather[]> {
    return this.weatherModel.find().lean().exec();
  }

  async removeAll(): Promise<void> {
    await this.weatherModel.deleteMany({}).exec();
  }
}
