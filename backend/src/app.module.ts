import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthController } from './health/health.controller.js';
import { CommonModule } from './common/common.module.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { TransactionsModule } from './transactions/transactions.module.js';
import { GoalsModule } from './goals/goals.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { AdminModule } from './admin/admin.module.js';
import { ObservabilityModule } from './observability/observability.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    DatabaseModule,
    CommonModule,
    UsersModule,
    AuthModule,
    TransactionsModule,
    GoalsModule,
    ReportsModule,
    AdminModule,
    ObservabilityModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
