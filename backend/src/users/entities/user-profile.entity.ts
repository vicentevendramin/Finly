import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity.js';

export enum EmploymentStatus {
  EMPLOYED = 'employed',
  SELF_EMPLOYED = 'self_employed',
  STUDENT = 'student',
  UNEMPLOYED = 'unemployed',
  RETIRED = 'retired',
  OTHER = 'other',
}

export enum IncomeFrequency {
  MONTHLY = 'monthly',
  BIWEEKLY = 'biweekly',
  WEEKLY = 'weekly',
  ANNUAL = 'annual',
}

/** One row per user, created at registration. Holds everything the Settings page edits. */
@Entity('user_profiles')
export class UserProfile {
  @PrimaryColumn({ name: 'user_id', type: 'int' })
  userId: number;

  @OneToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'display_name', type: 'varchar', length: 60, nullable: true })
  displayName: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'bytea', nullable: true })
  avatar: Buffer | null;

  @Column({ name: 'avatar_mime', type: 'varchar', nullable: true })
  avatarMime: string | null;

  @Column({ name: 'avatar_updated_at', type: 'timestamptz', nullable: true })
  avatarUpdatedAt: Date | null;

  @Column({
    name: 'employment_status',
    type: 'enum',
    enum: EmploymentStatus,
    nullable: true,
  })
  employmentStatus: EmploymentStatus | null;

  @Column({
    name: 'income_amount',
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  incomeAmount: string | null;

  @Column({
    name: 'income_frequency',
    type: 'enum',
    enum: IncomeFrequency,
    nullable: true,
  })
  incomeFrequency: IncomeFrequency | null;

  @Column({ name: 'pay_day', type: 'smallint', nullable: true })
  payDay: number | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
