import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Goal } from './goal.entity.js';

@Entity('goal_contributions')
@Index(['goal'])
@Check('"amount" > 0')
export class GoalContribution {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Goal, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'goal_id' })
  goal: Goal;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'varchar', nullable: true })
  note: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
