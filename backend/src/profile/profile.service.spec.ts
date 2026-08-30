import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Repository } from 'typeorm';
import { ProfileService } from './profile.service.js';
import {
  IncomeFrequency,
  UserProfile,
} from '../users/entities/user-profile.entity.js';

vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    rotate: vi.fn().mockReturnThis(),
    resize: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('webp-bytes')),
  })),
}));

describe('ProfileService', () => {
  let repo: {
    findOne: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };
  let service: ProfileService;

  const emptyProfile = (): Partial<UserProfile> => ({
    userId: 1,
    displayName: null,
    phone: null,
    avatar: null,
    avatarMime: null,
    avatarUpdatedAt: null,
    employmentStatus: null,
    incomeAmount: null,
    incomeFrequency: null,
    payDay: null,
  });

  beforeEach(() => {
    repo = {
      findOne: vi.fn().mockResolvedValue(null),
      create: vi.fn((v) => v),
      save: vi.fn((v) => v),
    };
    service = new ProfileService(repo as unknown as Repository<UserProfile>);
  });

  it('lazily creates the profile row on first read', async () => {
    const result = await service.getProfile(1);

    expect(repo.save).toHaveBeenCalled();
    expect(result).toMatchObject({ displayName: null, hasAvatar: false, monthlyIncome: null });
  });

  it('trims display name and normalizes blanks to null', async () => {
    repo.findOne.mockResolvedValue(emptyProfile());

    const result = await service.updateProfile(1, { displayName: '  Vicente  ', phone: '   ' });

    expect(result.displayName).toBe('Vicente');
    expect(result.phone).toBeNull();
  });

  it('stores work fields and derives a monthly-equivalent income', async () => {
    repo.findOne.mockResolvedValue(emptyProfile());

    const result = await service.updateWork(1, {
      incomeAmount: 120000,
      incomeFrequency: IncomeFrequency.ANNUAL,
      payDay: 5,
    });

    expect(result.incomeAmount).toBe(120000);
    expect(result.monthlyIncome).toBe(10000);
    expect(result.payDay).toBe(5);
  });

  it('rejects an avatar with an unsupported mime type', async () => {
    await expect(
      service.setAvatar(1, { buffer: Buffer.from('x'), mimetype: 'image/gif' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects an avatar upload with no file', async () => {
    await expect(service.setAvatar(1, undefined)).rejects.toThrow(BadRequestException);
  });

  it('re-encodes an accepted avatar to webp and marks it updated', async () => {
    repo.findOne.mockResolvedValue(emptyProfile());

    const result = await service.setAvatar(1, {
      buffer: Buffer.from('png'),
      mimetype: 'image/png',
    });

    const saved = repo.save.mock.calls.at(-1)![0];
    expect(saved.avatarMime).toBe('image/webp');
    expect(saved.avatar).toEqual(Buffer.from('webp-bytes'));
    expect(saved.avatarUpdatedAt).toBeInstanceOf(Date);
    expect(result.hasAvatar).toBe(true);
  });

  it('throws NotFound when fetching an avatar that was never set', async () => {
    repo.findOne.mockResolvedValue(emptyProfile());

    await expect(service.getAvatar(1)).rejects.toThrow(NotFoundException);
  });
});
