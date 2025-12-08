import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'sunmap_dev_secret',
    });
  }

  async validate(payload: any) {
    try {
      if (!payload) return null;
      const id = payload.sub;
      let user = null as any;
      if (id) {
        user = await this.usersService.findById(String(id));
      }
      if (!user && payload.email) {
        user = await this.usersService.findByEmail(String(payload.email));
      }
      if (!user) return null;
      // return a safe subset
      const obj = user.toObject ? user.toObject() : user;
      return { _id: obj._id, email: obj.email, roles: obj.roles, name: obj.name, username: obj.username };
    } catch (err) {
      this.logger.warn('JwtStrategy validate failed: ' + err);
      return null;
    }
  }
}

