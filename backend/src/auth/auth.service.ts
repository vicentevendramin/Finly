import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service.js';
import type { User, UserRole } from '../users/entities/user.entity.js';
import type { RegisterDto } from './dto/register.dto.js';
import type { LoginDto } from './dto/login.dto.js';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthResult {
  token: string;
  user: AuthUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Este email já está cadastrado.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.usersService.create(dto.email, passwordHash);

    return this.buildAuthResult(user);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Usuário ou senha inválidos.');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Usuário ou senha inválidos.');
    }

    return this.buildAuthResult(user);
  }

  async me(userId: number): Promise<{ user: AuthUser }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return { user: this.toAuthUser(user) };
  }

  private buildAuthResult(user: User): AuthResult {
    const token = this.jwtService.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    return { token, user: this.toAuthUser(user) };
  }

  private toAuthUser(user: User): AuthUser {
    return { id: String(user.id), email: user.email, role: user.role };
  }
}
