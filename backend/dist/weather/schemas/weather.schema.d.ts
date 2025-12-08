import { Document } from 'mongoose';
export type WeatherDocument = Weather & Document;
export declare class Weather {
    location: string;
    temperature?: number;
    humidity?: number;
    condition?: string;
}
export declare const WeatherSchema: import("mongoose").Schema<Weather, import("mongoose").Model<Weather, any, any, any, Document<unknown, any, Weather, any, {}> & Weather & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Weather, Document<unknown, {}, import("mongoose").FlatRecord<Weather>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Weather> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
//# sourceMappingURL=weather.schema.d.ts.map