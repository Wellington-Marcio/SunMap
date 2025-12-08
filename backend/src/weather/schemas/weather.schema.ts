import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WeatherDocument = Weather & Document;

@Schema({ timestamps: true })
export class Weather {
  @Prop({ required: true })
  location: string;

  @Prop()
  temperature?: number;

  @Prop()
  humidity?: number;

  @Prop()
  condition?: string;
}

export const WeatherSchema = SchemaFactory.createForClass(Weather);
