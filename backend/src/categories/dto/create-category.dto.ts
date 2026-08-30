import { IsEnum, IsHexColor, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { CategoryType } from '../entities/category.entity.js';

export class CreateCategoryDto {
  @IsNotEmpty({ message: 'The category name is required.' })
  @IsString()
  @MaxLength(40, { message: 'The category name is too long.' })
  name: string;

  @IsNotEmpty({ message: 'An emoji is required.' })
  @IsString()
  @MaxLength(32)
  emoji: string;

  @IsHexColor({ message: 'color must be a hex value like #2563EB.' })
  color: string;

  @IsOptional()
  @IsEnum(CategoryType, { message: 'type must be "income", "expense" or "both".' })
  type?: CategoryType;
}
