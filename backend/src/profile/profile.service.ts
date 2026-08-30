import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import sharp from 'sharp';
import {
  EmploymentStatus,
  IncomeFrequency,
  UserProfile,
} from '../users/entities/user-profile.entity.js';
import type { UpdateProfileDto } from './dto/update-profile.dto.js';
import type { UpdateWorkDto } from './dto/update-work.dto.js';

export interface ProfileResponse {
  displayName: string | null;
  phone: string | null;
  hasAvatar: boolean;
  avatarUpdatedAt: string | null;
  employmentStatus: EmploymentStatus | null;
  incomeAmount: number | null;
  incomeFrequency: IncomeFrequency | null;
  payDay: number | null;
  monthlyIncome: number | null;
}

const ALLOWED_AVATAR_MIME = new Set(['image/png', 'image/jpeg', 'image/webp']);
const AVATAR_SIZE = 512;

const FREQUENCY_TO_MONTHLY: Record<IncomeFrequency, number> = {
  [IncomeFrequency.MONTHLY]: 1,
  [IncomeFrequency.BIWEEKLY]: 26 / 12,
  [IncomeFrequency.WEEKLY]: 52 / 12,
  [IncomeFrequency.ANNUAL]: 1 / 12,
};

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(UserProfile)
    private readonly profileRepository: Repository<UserProfile>,
  ) {}

  /** Creates the (empty) profile row for a freshly registered user. */
  async createFor(userId: number): Promise<void> {
    await this.profileRepository.save(
      this.profileRepository.create({ userId }),
    );
  }

  async getProfile(userId: number): Promise<ProfileResponse> {
    return this.toResponse(await this.getOrCreate(userId));
  }

  async updateProfile(
    userId: number,
    dto: UpdateProfileDto,
  ): Promise<ProfileResponse> {
    const profile = await this.getOrCreate(userId);
    if (dto.displayName !== undefined) {
      profile.displayName = dto.displayName?.trim() || null;
    }
    if (dto.phone !== undefined) {
      profile.phone = dto.phone?.trim() || null;
    }
    return this.toResponse(await this.profileRepository.save(profile));
  }

  async updateWork(userId: number, dto: UpdateWorkDto): Promise<ProfileResponse> {
    const profile = await this.getOrCreate(userId);
    if (dto.employmentStatus !== undefined) {
      profile.employmentStatus = dto.employmentStatus ?? null;
    }
    if (dto.incomeAmount !== undefined) {
      profile.incomeAmount =
        dto.incomeAmount === null ? null : String(dto.incomeAmount);
    }
    if (dto.incomeFrequency !== undefined) {
      profile.incomeFrequency = dto.incomeFrequency ?? null;
    }
    if (dto.payDay !== undefined) {
      profile.payDay = dto.payDay ?? null;
    }
    return this.toResponse(await this.profileRepository.save(profile));
  }

  async getAvatar(
    userId: number,
  ): Promise<{ data: Buffer; mime: string; updatedAt: Date }> {
    const profile = await this.profileRepository.findOne({ where: { userId } });
    if (!profile?.avatar || !profile.avatarMime || !profile.avatarUpdatedAt) {
      throw new NotFoundException('No avatar set.');
    }
    return {
      data: profile.avatar,
      mime: profile.avatarMime,
      updatedAt: profile.avatarUpdatedAt,
    };
  }

  async setAvatar(
    userId: number,
    file: { buffer: Buffer; mimetype: string } | undefined,
  ): Promise<ProfileResponse> {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }
    if (!ALLOWED_AVATAR_MIME.has(file.mimetype)) {
      throw new BadRequestException('Avatar must be a PNG, JPEG or WebP image.');
    }

    let webp: Buffer;
    try {
      webp = await sharp(file.buffer)
        .rotate()
        .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover' })
        .webp({ quality: 82 })
        .toBuffer();
    } catch {
      throw new BadRequestException('Could not process that image.');
    }

    const profile = await this.getOrCreate(userId);
    profile.avatar = webp;
    profile.avatarMime = 'image/webp';
    profile.avatarUpdatedAt = new Date();
    return this.toResponse(await this.profileRepository.save(profile));
  }

  async deleteAvatar(userId: number): Promise<void> {
    const profile = await this.getOrCreate(userId);
    profile.avatar = null;
    profile.avatarMime = null;
    profile.avatarUpdatedAt = null;
    await this.profileRepository.save(profile);
  }

  private async getOrCreate(userId: number): Promise<UserProfile> {
    const existing = await this.profileRepository.findOne({ where: { userId } });
    if (existing) return existing;
    return this.profileRepository.save(
      this.profileRepository.create({ userId }),
    );
  }

  private toResponse(profile: UserProfile): ProfileResponse {
    const incomeAmount =
      profile.incomeAmount != null ? parseFloat(profile.incomeAmount) : null;
    const incomeFrequency = profile.incomeFrequency ?? null;
    const monthlyIncome =
      incomeAmount != null && incomeFrequency
        ? Math.round(
            incomeAmount * FREQUENCY_TO_MONTHLY[incomeFrequency] * 100,
          ) / 100
        : null;

    return {
      displayName: profile.displayName ?? null,
      phone: profile.phone ?? null,
      hasAvatar: profile.avatar != null,
      avatarUpdatedAt: profile.avatarUpdatedAt
        ? profile.avatarUpdatedAt.toISOString()
        : null,
      employmentStatus: profile.employmentStatus ?? null,
      incomeAmount,
      incomeFrequency,
      payDay: profile.payDay ?? null,
      monthlyIncome,
    };
  }
}
