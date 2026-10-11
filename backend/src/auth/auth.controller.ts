import { Body, Controller, HttpException, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() body: any) {
    const { email, password } = body || {};
    if (!email || !password) {
      throw new HttpException('Missing credentials', HttpStatus.BAD_REQUEST);
    }

    const result = this.authService.validateUser(email, password);
    if (!result) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    return { access_token: result.token };
  }
}
