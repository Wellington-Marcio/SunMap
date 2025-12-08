import { Model } from 'mongoose';
import { Weather, WeatherDocument } from './schemas/weather.schema';
export declare class WeatherService {
    private weatherModel;
    constructor(weatherModel: Model<WeatherDocument>);
    create(data: Partial<Weather>): Promise<Weather>;
    findAll(): Promise<Weather[]>;
    removeAll(): Promise<void>;
}
//# sourceMappingURL=weather.service.d.ts.map