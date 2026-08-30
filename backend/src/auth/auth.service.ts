import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service.js';
import type { User, UserRole } from '../users/entities/user.entity.js';
import { UserProfile } from '../users/entities/user-profile.entity.js';
import { Category } from '../categories/entities/category.entity.js';
import { seedCategoriesForUser } from '../categories/category-seeds.js';
import type { RegisterDto } from './dto/register.dto.js';
import type { LoginDto } from './dto/login.dto.js';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  displayName: string | null;
  avatarUpdatedAt: string | null;
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
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    @InjectRepository(UserProfile)
    private readonly profileRepository: Repository<UserProfile>,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('This email is already registered.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.usersService.create(dto.email, passwordHash);

    await this.profileRepository.save(
      this.profileRepository.create({ userId: user.id }),
    );
    await seedCategoriesForUser(this.categoriesRepository, user.id, dto.locale);

    return this.buildAuthResult(user);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid username or password.');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid username or password.');
    }

    return this.buildAuthResult(user);
  }

  async me(userId: number): Promise<{ user: AuthUser }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return { user: await this.toAuthUser(user) };
  }

  async changeEmail(
    userId: number,
    newEmail: string,
    currentPassword: string,
  ): Promise<AuthResult> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Incorrect password.');
    }

    const normalized = newEmail.toLowerCase().trim();
    if (normalized !== user.email) {
      const clash = await this.usersService.findByEmail(normalized);
      if (clash) {
        throw new ConflictException('This email is already registered.');
      }
      await this.usersService.updateEmail(userId, normalized);
    }

    return this.buildAuthResult({ ...user, email: normalized });
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Incorrect password.');
    }
    await this.usersService.updatePassword(userId, await bcrypt.hash(newPassword, 12));
  }

  private async buildAuthResult(user: User): Promise<AuthResult> {
    const token = this.jwtService.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    return { token, user: await this.toAuthUser(user) };
  }

  private async toAuthUser(user: User): Promise<AuthUser> {
    const profile = await this.profileRepository.findOne({
      where: { userId: user.id },
    });
    return {
      id: String(user.id),
      email: user.email,
      role: user.role,
      displayName: profile?.displayName ?? null,
      avatarUpdatedAt: profile?.avatarUpdatedAt
        ? profile.avatarUpdatedAt.toISOString()
        : null,
    };
  }
}
