import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './roles.guard';

const jwtSecret = process.env.JWT_SECRET ?? 'sunmap_dev_secret';
const jwtExpiresRaw = process.env.JWT_EXPIRES_IN;
const jwtExpires: string | number = (() => {
  if (!jwtExpiresRaw) return '1h';
  const n = Number(jwtExpiresRaw);
  return Number.isFinite(n) ? n : jwtExpiresRaw;
})();

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtSecret,
      // `expiresIn` accepts number or string; cast to any to satisfy varying type definitions
      signOptions: { expiresIn: jwtExpires as any },
    }),
  ],
  providers: [AuthService, JwtStrategy, RolesGuard],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
