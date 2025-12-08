import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ default: ['user'] })
  roles: string[];
}

export type UserDocument = User & Document;

export const UserSchema = SchemaFactory.createForClass(User);

export const UserModelName = User.name;