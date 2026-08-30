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
import { User } from '../../users/entities/user.entity.js';
import { Category } from '../../categories/entities/category.entity.js';

@Entity('goals')
@Index(['user'])
@Check('"target_amount" > 0')
export class Goal {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  name: string;

  @Column({ name: 'target_amount', type: 'numeric', precision: 12, scale: 2 })
  targetAmount: string;

  /**
   * Optional link to a category: matching `income`-type transactions in that
   * category count toward the goal's progress (see GoalsService.computeProgress).
   */
  @ManyToOne(() => Category, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'tag_id' })
  tag: Category | null;

  @Column({ type: 'date', nullable: true })
  deadline: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
