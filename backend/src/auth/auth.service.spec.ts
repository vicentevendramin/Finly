import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Repository } from 'typeorm';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { UserRole, type User } from '../users/entities/user.entity.js';
import type { Category } from '../categories/entities/category.entity.js';

const buildUser = (overrides: Partial<User> = {}): User => ({
  id: 1,
  email: 'test@example.com',
  passwordHash: 'hashed',
  role: UserRole.USER,
  createdAt: new Date(),
  ...overrides,
});

describe('AuthService', () => {
  let usersService: { findByEmail: ReturnType<typeof vi.fn>; findById: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
  let jwtService: { sign: ReturnType<typeof vi.fn> };
  let categoriesRepository: { create: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn> };
  let authService: AuthService;

  beforeEach(() => {
    usersService = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
    };
    jwtService = { sign: vi.fn().mockReturnValue('signed.jwt.token') };
    categoriesRepository = {
      create: vi.fn((v) => v),
      save: vi.fn((v) => v),
    };
    authService = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
      categoriesRepository as unknown as Repository<Category>,
    );
  });

  describe('register', () => {
    it('creates a user and returns a token when the email is free', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(buildUser());

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(usersService.create).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
      );
      expect(categoriesRepository.save).toHaveBeenCalled(); // starter categories seeded
      expect(result).toEqual({
        token: 'signed.jwt.token',
        user: { id: '1', email: 'test@example.com', role: UserRole.USER },
      });
    });

    it('throws ConflictException when the email is already registered', async () => {
      usersService.findByEmail.mockResolvedValue(buildUser());

      await expect(
        authService.register({ email: 'test@example.com', password: 'password123' }),
      ).rejects.toThrow(ConflictException);
      expect(usersService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('returns a token when credentials are valid', async () => {
      const passwordHash = await bcrypt.hash('password123', 4);
      usersService.findByEmail.mockResolvedValue(buildUser({ passwordHash }));

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.user).toEqual({ id: '1', email: 'test@example.com', role: UserRole.USER });
    });

    it('throws UnauthorizedException when the user does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'nope@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when the password does not match', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 4);
      usersService.findByEmail.mockResolvedValue(buildUser({ passwordHash }));

      await expect(
        authService.login({ email: 'test@example.com', password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('me', () => {
    it('returns the current user', async () => {
      usersService.findById.mockResolvedValue(buildUser());

      const result = await authService.me(1);

      expect(result).toEqual({ user: { id: '1', email: 'test@example.com', role: UserRole.USER } });
    });

    it('throws NotFoundException when the user no longer exists', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(authService.me(999)).rejects.toThrow(NotFoundException);
    });
  });
});
