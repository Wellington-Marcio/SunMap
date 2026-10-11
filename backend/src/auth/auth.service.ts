import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  private adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@sunmap.com';
  private adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || '123456';
  private jwtSecret = process.env.JWT_SECRET || 'changeme';

  validateUser(email: string, password: string) {
    if (email === this.adminEmail && password === this.adminPassword) {
      const payload = { sub: email };
      const token = jwt.sign(payload, this.jwtSecret, { expiresIn: '7d' });
      return { token };
    }
    return null;
  }
}
