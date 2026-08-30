import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Repository } from 'typeorm';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { UserRole, type User } from '../users/entities/user.entity.js';
import type { Category } from '../categories/entities/category.entity.js';
import type { UserProfile } from '../users/entities/user-profile.entity.js';

const buildUser = (overrides: Partial<User> = {}): User => ({
  id: 1,
  email: 'test@example.com',
  passwordHash: 'hashed',
  role: UserRole.USER,
  createdAt: new Date(),
  ...overrides,
});

describe('AuthService', () => {
  let usersService: {
    findByEmail: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    updateEmail: ReturnType<typeof vi.fn>;
    updatePassword: ReturnType<typeof vi.fn>;
  };
  let jwtService: { sign: ReturnType<typeof vi.fn> };
  let categoriesRepository: { create: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn> };
  let profileRepository: {
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
  };
  let authService: AuthService;

  beforeEach(() => {
    usersService = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      updateEmail: vi.fn(),
      updatePassword: vi.fn(),
    };
    jwtService = { sign: vi.fn().mockReturnValue('signed.jwt.token') };
    categoriesRepository = {
      create: vi.fn((v) => v),
      save: vi.fn((v) => v),
    };
    profileRepository = {
      create: vi.fn((v) => v),
      save: vi.fn((v) => v),
      findOne: vi.fn().mockResolvedValue(null),
    };
    authService = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
      categoriesRepository as unknown as Repository<Category>,
      profileRepository as unknown as Repository<UserProfile>,
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
        user: { id: '1', email: 'test@example.com', role: UserRole.USER, displayName: null, avatarUpdatedAt: null },
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

      expect(result.user).toMatchObject({ id: '1', email: 'test@example.com', role: UserRole.USER });
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

      expect(result).toEqual({ user: { id: '1', email: 'test@example.com', role: UserRole.USER, displayName: null, avatarUpdatedAt: null } });
    });

    it('throws NotFoundException when the user no longer exists', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(authService.me(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('changeEmail', () => {
    it('requires the current password and returns a fresh token', async () => {
      const passwordHash = await bcrypt.hash('password123', 4);
      usersService.findById.mockResolvedValue(buildUser({ passwordHash }));
      usersService.findByEmail.mockResolvedValue(null);

      const result = await authService.changeEmail(1, 'New@Example.com', 'password123');

      expect(usersService.updateEmail).toHaveBeenCalledWith(1, 'new@example.com');
      expect(result.token).toBe('signed.jwt.token');
      expect(result.user.email).toBe('new@example.com');
    });

    it('rejects a wrong password', async () => {
      const passwordHash = await bcrypt.hash('password123', 4);
      usersService.findById.mockResolvedValue(buildUser({ passwordHash }));

      await expect(
        authService.changeEmail(1, 'new@example.com', 'wrong'),
      ).rejects.toThrow(UnauthorizedException);
      expect(usersService.updateEmail).not.toHaveBeenCalled();
    });

    it('rejects an email already taken by someone else', async () => {
      const passwordHash = await bcrypt.hash('password123', 4);
      usersService.findById.mockResolvedValue(buildUser({ passwordHash }));
      usersService.findByEmail.mockResolvedValue(buildUser({ id: 2, email: 'new@example.com' }));

      await expect(
        authService.changeEmail(1, 'new@example.com', 'password123'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('changePassword', () => {
    it('hashes and stores the new password after verifying the current one', async () => {
      const passwordHash = await bcrypt.hash('old-password', 4);
      usersService.findById.mockResolvedValue(buildUser({ passwordHash }));

      await authService.changePassword(1, 'old-password', 'brand-new-password');

      expect(usersService.updatePassword).toHaveBeenCalledWith(1, expect.any(String));
    });

    it('rejects a wrong current password', async () => {
      const passwordHash = await bcrypt.hash('old-password', 4);
      usersService.findById.mockResolvedValue(buildUser({ passwordHash }));

      await expect(
        authService.changePassword(1, 'wrong', 'brand-new-password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
