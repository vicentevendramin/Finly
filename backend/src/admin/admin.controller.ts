import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { AdminErrorsQueryDto, AdminStatsQueryDto } from './dto/admin-query.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UserRole } from '../users/entities/user.entity.js';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats(@Query() query: AdminStatsQueryDto) {
    return this.adminService.getStats(query.from, query.to);
  }

  @Get('errors')
  getErrors(@Query() query: AdminErrorsQueryDto) {
    return this.adminService.getErrors(query.limit);
  }
}
