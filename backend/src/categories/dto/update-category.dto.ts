import { IsEnum, IsHexColor, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { CategoryType } from '../entities/category.entity.js';

export class UpdateCategoryDto {
  @IsOptional()
  @IsNotEmpty({ message: 'The category name is required.' })
  @IsString()
  @MaxLength(40, { message: 'The category name is too long.' })
  name?: string;

  @IsOptional()
  @IsNotEmpty({ message: 'An emoji is required.' })
  @IsString()
  @MaxLength(32)
  emoji?: string;

  @IsOptional()
  @IsHexColor({ message: 'color must be a hex value like #2563EB.' })
  color?: string;

  @IsOptional()
  @IsEnum(CategoryType, { message: 'type must be "income", "expense" or "both".' })
  type?: CategoryType;
}
