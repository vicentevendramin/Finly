import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity.js';
import { UserProfile } from '../users/entities/user-profile.entity.js';
import { Transaction } from '../transactions/entities/transaction.entity.js';
import { Category } from '../categories/entities/category.entity.js';
import { Goal } from '../goals/entities/goal.entity.js';
import { GoalContribution } from '../goals/entities/goal-contribution.entity.js';
import { ErrorLog } from '../common/entities/error-log.entity.js';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  database: process.env.DB_NAME ?? 'financeapp',
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? '',
  entities: [
    User,
    UserProfile,
    Transaction,
    Category,
    Goal,
    GoalContribution,
    ErrorLog,
  ],
  migrations: ['src/database/migrations/*.ts'],
});
