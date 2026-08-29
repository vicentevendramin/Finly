import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { AppConfig } from '../config/configuration.js';
import { User } from '../users/entities/user.entity.js';
import { Transaction } from '../transactions/entities/transaction.entity.js';
import { Goal } from '../goals/entities/goal.entity.js';
import { GoalContribution } from '../goals/entities/goal-contribution.entity.js';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => ({
        type: 'postgres',
        host: configService.get('db.host', { infer: true }),
        port: configService.get('db.port', { infer: true }),
        database: configService.get('db.name', { infer: true }),
        username: configService.get('db.user', { infer: true }),
        password: configService.get('db.password', { infer: true }),
        entities: [User, Transaction, Goal, GoalContribution],
        synchronize: false,
        migrationsRun: true,
        migrations: ['dist/database/migrations/*.js'],
      }),
    }),
  ],
})
export class DatabaseModule {}
