import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string) {
    return this.userModel.findById(id).exec();
  }

  async list(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.userModel.find().select('-passwordHash').skip(skip).limit(limit).exec(),
      this.userModel.countDocuments().exec(),
    ]);
    const totalPages = Math.max(1, Math.ceil((total || 0) / limit));
    return { data, total, page, limit, totalPages };
  }

  async create(email: string, password: string, roles: string[] = ['admin']) {
    const passwordHash = await bcrypt.hash(password, 10);
    const created = new this.userModel({ email, passwordHash, roles });
    return created.save();
  }

  async ensureDefaultAdmin(email: string, password: string) {
    const existing = await this.findByEmail(email);
    if (existing) {
      this.logger.log(`Default admin already exists: ${email}`);
      return existing;
    }
    this.logger.log(`Creating default admin: ${email}`);
    return this.create(email, password, ['admin']);
  }
}
