import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { ProfileService } from './profile.service.js';
import { AuthService } from '../auth/auth.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UpdateEmailDto } from './dto/update-email.dto.js';
import { UpdatePasswordDto } from './dto/update-password.dto.js';
import { UpdateWorkDto } from './dto/update-work.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';

interface UploadedImage {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

@Controller('users/me')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly authService: AuthService,
  ) {}

  @Get('profile')
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.profileService.getProfile(user.id);
  }

  @Patch('profile')
  updateProfile(@CurrentUser() user: JwtPayload, @Body() dto: UpdateProfileDto) {
    return this.profileService.updateProfile(user.id, dto);
  }

  @Patch('email')
  updateEmail(@CurrentUser() user: JwtPayload, @Body() dto: UpdateEmailDto) {
    return this.authService.changeEmail(user.id, dto.newEmail, dto.currentPassword);
  }

  @Patch('password')
  @HttpCode(204)
  updatePassword(@CurrentUser() user: JwtPayload, @Body() dto: UpdatePasswordDto) {
    return this.authService.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Patch('work')
  updateWork(@CurrentUser() user: JwtPayload, @Body() dto: UpdateWorkDto) {
    return this.profileService.updateWork(user.id, dto);
  }

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: AVATAR_MAX_BYTES } }),
  )
  setAvatar(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: UploadedImage | undefined,
  ) {
    return this.profileService.setAvatar(user.id, file);
  }

  @Get('avatar')
  async getAvatar(
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { data, mime, updatedAt } = await this.profileService.getAvatar(user.id);
    const etag = `"${updatedAt.getTime()}"`;

    if (req.headers['if-none-match'] === etag) {
      res.status(304).end();
      return;
    }

    res.set({
      'Content-Type': mime,
      'Cache-Control': 'private, max-age=0, must-revalidate',
      ETag: etag,
    });
    res.send(data);
  }

  @Delete('avatar')
  @HttpCode(204)
  deleteAvatar(@CurrentUser() user: JwtPayload) {
    return this.profileService.deleteAvatar(user.id);
  }
}
