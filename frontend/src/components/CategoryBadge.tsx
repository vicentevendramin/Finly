import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Category } from '../types';

interface CategoryBadgeProps {
  category: Category | null;
  className?: string;
}

/** Compact chip: colour dot + emoji + name, or a neutral "Uncategorized" label. */
const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, className = '' }) => {
  const { t } = useTranslation();

  const base =
    'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-full ' +
    'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200';

  if (!category) {
    return (
      <span className={`${base} text-gray-500 dark:text-gray-400 ${className}`}>
        {t('categories.uncategorized')}
      </span>
    );
  }

  return (
    <span className={`${base} ${className}`}>
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: category.color }}
        aria-hidden
      />
      <span aria-hidden>{category.emoji}</span>
      <span className="truncate">{category.name}</span>
    </span>
  );
};

export default CategoryBadge;
