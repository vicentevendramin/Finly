import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { User } from '../users/entities/user.entity.js';
import { Transaction } from '../transactions/entities/transaction.entity.js';
import { ErrorLog } from '../common/entities/error-log.entity.js';
import { AdminService } from './admin.service.js';
import { AdminController } from './admin.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, Transaction, ErrorLog]), AuthModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
