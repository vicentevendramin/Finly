import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goal } from './entities/goal.entity.js';
import { GoalContribution } from './entities/goal-contribution.entity.js';
import { Transaction, TransactionType } from '../transactions/entities/transaction.entity.js';
import { Category } from '../categories/entities/category.entity.js';
import {
  toCategoryResponse,
  type CategoryResponse,
} from '../categories/categories.service.js';
import { CreateGoalDto } from './dto/create-goal.dto.js';
import { UpdateGoalDto } from './dto/update-goal.dto.js';
import { CreateContributionDto } from './dto/create-contribution.dto.js';

export interface GoalResponse {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  category: CategoryResponse | null;
  deadline: string | null;
}

@Injectable()
export class GoalsService {
  constructor(
    @InjectRepository(Goal)
    private readonly goalsRepository: Repository<Goal>,
    @InjectRepository(GoalContribution)
    private readonly contributionsRepository: Repository<GoalContribution>,
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  async findAll(userId: number): Promise<GoalResponse[]> {
    const goals = await this.goalsRepository.find({
      where: { user: { id: userId } },
      relations: { tag: true },
      order: { createdAt: 'DESC' },
    });
    return Promise.all(goals.map((goal) => this.toResponse(userId, goal)));
  }

  async findOne(userId: number, id: number): Promise<GoalResponse> {
    const goal = await this.findOwnedGoal(userId, id);
    return this.toResponse(userId, goal);
  }

  async create(userId: number, dto: CreateGoalDto): Promise<GoalResponse> {
    const goal = this.goalsRepository.create({
      user: { id: userId },
      name: dto.name.trim(),
      targetAmount: String(dto.targetAmount),
      tag: await this.resolveTag(userId, dto.categoryId),
      deadline: dto.deadline ?? null,
    });
    const saved = await this.goalsRepository.save(goal);
    return this.toResponse(userId, saved);
  }

  async update(userId: number, id: number, dto: UpdateGoalDto): Promise<GoalResponse> {
    const goal = await this.findOwnedGoal(userId, id);

    if (dto.name !== undefined) goal.name = dto.name.trim();
    if (dto.targetAmount !== undefined) goal.targetAmount = String(dto.targetAmount);
    if (dto.categoryId !== undefined) {
      goal.tag = await this.resolveTag(userId, dto.categoryId);
    }
    if (dto.deadline !== undefined) goal.deadline = dto.deadline;

    const saved = await this.goalsRepository.save(goal);
    return this.toResponse(userId, saved);
  }

  async remove(userId: number, id: number): Promise<void> {
    const result = await this.goalsRepository.delete({ id, user: { id: userId } });
    if (!result.affected) {
      throw new NotFoundException('Goal not found.');
    }
  }

  async addContribution(
    userId: number,
    goalId: number,
    dto: CreateContributionDto,
  ): Promise<GoalResponse> {
    const goal = await this.findOwnedGoal(userId, goalId);

    const contribution = this.contributionsRepository.create({
      goal,
      amount: String(dto.amount),
      date: dto.date ?? new Date().toISOString().split('T')[0],
      note: dto.note?.trim() || null,
    });
    await this.contributionsRepository.save(contribution);

    return this.toResponse(userId, goal);
  }

  private async resolveTag(
    userId: number,
    categoryId?: number | null,
  ): Promise<Category | null> {
    if (categoryId === undefined || categoryId === null) return null;
    const category = await this.categoriesRepository.findOne({
      where: { id: categoryId, user: { id: userId } },
    });
    if (!category) {
      throw new NotFoundException('Category not found.');
    }
    return category;
  }

  private async findOwnedGoal(userId: number, id: number): Promise<Goal> {
    const goal = await this.goalsRepository.findOne({
      where: { id, user: { id: userId } },
      relations: { tag: true },
    });
    if (!goal) {
      throw new NotFoundException('Goal not found.');
    }
    return goal;
  }

  private async toResponse(userId: number, goal: Goal): Promise<GoalResponse> {
    const currentAmount = await this.computeProgress(userId, goal);
    return {
      id: String(goal.id),
      name: goal.name,
      targetAmount: parseFloat(goal.targetAmount),
      currentAmount,
      category: goal.tag ? toCategoryResponse(goal.tag) : null,
      deadline: goal.deadline,
    };
  }

  private async computeProgress(userId: number, goal: Goal): Promise<number> {
    const contributionsRow = await this.contributionsRepository
      .createQueryBuilder('gc')
      .select('COALESCE(SUM(gc.amount), 0)', 'sum')
      .where('gc.goal_id = :goalId', { goalId: goal.id })
      .getRawOne<{ sum: string }>();

    let linkedIncomeSum = 0;
    if (goal.tag) {
      const incomeRow = await this.transactionsRepository
        .createQueryBuilder('t')
        .select('COALESCE(SUM(t.amount), 0)', 'sum')
        .where('t.user_id = :userId', { userId })
        .andWhere('t.tag_id = :tagId', { tagId: goal.tag.id })
        .andWhere('t.type = :type', { type: TransactionType.INCOME })
        .getRawOne<{ sum: string }>();
      linkedIncomeSum = parseFloat(incomeRow?.sum ?? '0');
    }

    return parseFloat(contributionsRow?.sum ?? '0') + linkedIncomeSum;
  }
}
