import React, { Suspense, lazy, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import type { Category, CategoryType, NewCategoryData } from '../types';
import { labelClass, primaryButtonClass, textInputClass } from '../styles/formStyles';

const EmojiPicker = lazy(() => import('./EmojiPicker'));

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: NewCategoryData) => Promise<void>;
  categoryToEdit: Category | null;
}

const TYPES: CategoryType[] = ['expense', 'income', 'both'];
const DEFAULT_COLOR = '#2563eb';
const DEFAULT_EMOJI = '🏷️';
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categoryToEdit,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(DEFAULT_EMOJI);
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [type, setType] = useState<CategoryType>('expense');
  const [showPicker, setShowPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setName(categoryToEdit?.name ?? '');
    setEmoji(categoryToEdit?.emoji ?? DEFAULT_EMOJI);
    setColor(categoryToEdit?.color ?? DEFAULT_COLOR);
    setType(categoryToEdit?.type ?? 'expense');
    setShowPicker(false);
    setError('');
    setIsLoading(false);
  }, [isOpen, categoryToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !emoji.trim() || !HEX_RE.test(color)) {
      setError(t('categoryModal.validationError'));
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await onSave({ name: name.trim(), emoji: emoji.trim(), color: color.toLowerCase(), type });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('categoryModal.validationError'));
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg z-50 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
            {categoryToEdit ? t('categoryModal.editTitle') : t('categoryModal.newTitle')}
          </h3>
          <button
            onClick={onClose}
            aria-label={t('common.close')}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              {/* Emoji */}
              <div>
                <label className={`${labelClass} mb-1`}>{t('categoryModal.emojiLabel')}</label>
                <button
                  type="button"
                  onClick={() => setShowPicker((v) => !v)}
                  className="w-14 h-14 text-2xl rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  {emoji}
                </button>
              </div>

              {/* Colour */}
              <div className="flex-1">
                <label htmlFor="category-color" className={`${labelClass} mb-1`}>
                  {t('categoryModal.colorLabel')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="category-color"
                    value={HEX_RE.test(color) ? color : DEFAULT_COLOR}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-11 w-14 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent p-1"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className={textInputClass}
                    placeholder="#2563EB"
                  />
                </div>
              </div>
            </div>

            {showPicker && (
              <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <Suspense fallback={null}>
                  <EmojiPicker
                    onSelect={(e) => {
                      setEmoji(e);
                      setShowPicker(false);
                    }}
                  />
                </Suspense>
              </div>
            )}

            {/* Name */}
            <div>
              <label htmlFor="category-name" className={`${labelClass} mb-1`}>
                {t('categoryModal.nameLabel')}
              </label>
              <input
                type="text"
                id="category-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('categoryModal.namePlaceholder')}
                className={textInputClass}
              />
            </div>

            {/* Type */}
            <div>
              <span className={`${labelClass} mb-1 block`}>{t('categoryModal.typeLabel')}</span>
              <div className="grid grid-cols-3 gap-2">
                {TYPES.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setType(option)}
                    className={`py-2 rounded-lg text-sm font-semibold ${
                      type === option
                        ? 'bg-primary-600 text-white shadow'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {t(`categoryModal.type.${option}`)}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-danger-500 text-sm">{error}</p>}
          </div>

          <div className="mt-8">
            <button type="submit" disabled={isLoading} className={primaryButtonClass}>
              {isLoading ? t('categoryModal.saving') : t('categoryModal.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryFormModal;
