import { WeatherService } from './weather.service';
import { Weather } from './schemas/weather.schema';
export declare class WeatherController {
    private readonly weatherService;
    constructor(weatherService: WeatherService);
    getAll(): Promise<Weather[]>;
    create(body: Partial<Weather>): Promise<Weather>;
}
//# sourceMappingURL=weather.controller.d.ts.map