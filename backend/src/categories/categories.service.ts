import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category, CategoryType } from './entities/category.entity.js';
import type { CreateCategoryDto } from './dto/create-category.dto.js';
import type { UpdateCategoryDto } from './dto/update-category.dto.js';

export interface CategoryResponse {
  id: string;
  name: string;
  emoji: string;
  color: string;
  type: CategoryType;
}

/**
 * Maps a Category entity (or a raw {id,name,emoji,color,type} row from a join)
 * to the JSON shape the frontend consumes. Exported so the transactions/goals/
 * reports services can embed a category on their own responses without pulling
 * in the whole service.
 */
export function toCategoryResponse(category: {
  id: number;
  name: string;
  emoji: string;
  color: string;
  type: CategoryType;
}): CategoryResponse {
  return {
    id: String(category.id),
    name: category.name,
    emoji: category.emoji,
    color: category.color,
    type: category.type,
  };
}

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  async findAll(userId: number): Promise<CategoryResponse[]> {
    const categories = await this.categoriesRepository.find({
      where: { user: { id: userId } },
      order: { name: 'ASC' },
    });
    return categories.map(toCategoryResponse);
  }

  async create(userId: number, dto: CreateCategoryDto): Promise<CategoryResponse> {
    await this.assertNameAvailable(userId, dto.name);

    const category = this.categoriesRepository.create({
      user: { id: userId },
      name: dto.name.trim(),
      emoji: dto.emoji.trim(),
      color: dto.color.toLowerCase(),
      type: dto.type ?? CategoryType.BOTH,
    });
    const saved = await this.categoriesRepository.save(category);
    return toCategoryResponse(saved);
  }

  async update(
    userId: number,
    id: number,
    dto: UpdateCategoryDto,
  ): Promise<CategoryResponse> {
    const category = await this.findOwned(userId, id);

    if (dto.name !== undefined && dto.name.trim().toLowerCase() !== category.name.toLowerCase()) {
      await this.assertNameAvailable(userId, dto.name, id);
    }
    if (dto.name !== undefined) category.name = dto.name.trim();
    if (dto.emoji !== undefined) category.emoji = dto.emoji.trim();
    if (dto.color !== undefined) category.color = dto.color.toLowerCase();
    if (dto.type !== undefined) category.type = dto.type;

    const saved = await this.categoriesRepository.save(category);
    return toCategoryResponse(saved);
  }

  async remove(userId: number, id: number): Promise<void> {
    // Transactions/goals referencing this category have `tag_id` set to NULL
    // by the FK's ON DELETE SET NULL — they become "Uncategorized".
    const result = await this.categoriesRepository.delete({
      id,
      user: { id: userId },
    });
    if (!result.affected) {
      throw new NotFoundException('Category not found.');
    }
  }

  /** How many transactions currently point at this category (for delete confirmations). */
  async usageCount(userId: number, id: number): Promise<number> {
    await this.findOwned(userId, id);
    return this.categoriesRepository.manager
      .createQueryBuilder()
      .from('transactions', 't')
      .where('t.user_id = :userId', { userId })
      .andWhere('t.tag_id = :id', { id })
      .getCount();
  }

  private async findOwned(userId: number, id: number): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id, user: { id: userId } },
    });
    if (!category) {
      throw new NotFoundException('Category not found.');
    }
    return category;
  }

  private async assertNameAvailable(
    userId: number,
    name: string,
    exceptId?: number,
  ): Promise<void> {
    const qb = this.categoriesRepository
      .createQueryBuilder('c')
      .where('c.user_id = :userId', { userId })
      .andWhere('LOWER(c.name) = LOWER(:name)', { name: name.trim() });
    if (exceptId) {
      qb.andWhere('c.id != :exceptId', { exceptId });
    }
    if ((await qb.getCount()) > 0) {
      throw new ConflictException('You already have a category with that name.');
    }
  }
}
