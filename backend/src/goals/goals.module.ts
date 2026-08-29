import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { Goal } from './entities/goal.entity.js';
import { GoalContribution } from './entities/goal-contribution.entity.js';
import { Transaction } from '../transactions/entities/transaction.entity.js';
import { GoalsService } from './goals.service.js';
import { GoalsController } from './goals.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Goal, GoalContribution, Transaction]),
    AuthModule,
  ],
  controllers: [GoalsController],
  providers: [GoalsService],
})
export class GoalsModule {}
