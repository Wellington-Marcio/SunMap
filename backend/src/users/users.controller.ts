import { Controller, Get, Post, Body, Query, DefaultValuePipe, ParseIntPipe, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UsersService } from './users.service';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Get()
  async list(
    @Query('page', new DefaultValuePipe('1'), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe('10'), ParseIntPipe) limit = 10,
  ) {
    // limit guard
    const maxLimit = 100;
    if (limit > maxLimit) limit = maxLimit;
    if (page < 1) page = 1;
    return this.usersService.list(page, limit);
  }

  @Post('seed')
  async seed(@Body() body: { email: string; password: string }) {
    const email = body.email;
    const password = body.password;
    return this.usersService.ensureDefaultAdmin(email, password);
  }

  @Post()
  async create(@Body() body: any) {
    // validate input using DTO
    const dto = plainToInstance(CreateUserDto, body);
    const errors = await validate(dto as any);
    if (errors && errors.length > 0) {
      throw new BadRequestException({ message: 'Invalid payload', details: errors });
    }

    // check existing
    const existing = await this.usersService.findByEmail((dto as any).email);
    if (existing) {
      throw new BadRequestException('User already exists');
    }

    const created = await this.usersService.create((dto as any).email, (dto as any).password, ['user']);
    // hide passwordHash in response
    const obj = created.toObject ? created.toObject() : created;
    if (obj && 'passwordHash' in obj) delete (obj as any).passwordHash;
    return obj;
  }
}
