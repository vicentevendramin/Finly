import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { Category, NewCategoryData } from '../types';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '../hooks/useCategories';
import { apiService } from '../services/apiService';
import CategoryFormModal from '../components/CategoryFormModal';

const CategoriesPage: React.FC = () => {
  const { t } = useTranslation();
  const { data: categories = [], isLoading, isError } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const openNew = () => {
    setEditing(null);
    setIsModalOpen(true);
  };
  const openEdit = (category: Category) => {
    setEditing(category);
    setIsModalOpen(true);
  };

  const handleSave = async (data: NewCategoryData) => {
    if (editing) {
      await updateCategory.mutateAsync({ id: editing.id, data });
    } else {
      await createCategory.mutateAsync(data);
    }
    setIsModalOpen(false);
    setEditing(null);
  };

  const handleDelete = async (category: Category) => {
    let count = 0;
    try {
      count = await apiService.getCategoryUsage(category.id);
    } catch {
      /* fall back to the generic confirmation */
    }
    const message =
      count > 0
        ? t('categoriesPage.confirmDeleteInUse', { count })
        : t('categoriesPage.confirmDelete');
    if (window.confirm(message)) {
      deleteCategory.mutate(category.id);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
          {t('categoriesPage.title')}
        </h3>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          {t('categoriesPage.newCategory')}
        </button>
      </div>

      {isLoading ? (
        <p className="text-gray-500 dark:text-gray-400">{t('categoriesPage.loading')}</p>
      ) : isError ? (
        <p className="text-danger-500">{t('categoriesPage.loadError')}</p>
      ) : categories.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">{t('categoriesPage.empty')}</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
          {categories.map((category) => (
            <li key={category.id} className="flex items-center gap-3 py-3">
              <span
                className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                style={{ backgroundColor: `${category.color}22` }}
              >
                {category.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {category.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t(`categoryModal.type.${category.type}`)}
                </p>
              </div>
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: category.color }}
                aria-hidden
              />
              <button
                onClick={() => openEdit(category)}
                className="text-primary-500 hover:text-primary-700 dark:hover:text-primary-400 p-1"
                title={t('common.edit')}
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(category)}
                className="text-danger-500 hover:text-danger-700 dark:hover:text-danger-400 p-1"
                title={t('common.delete')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        categoryToEdit={editing}
      />
    </div>
  );
};

export default CategoriesPage;
