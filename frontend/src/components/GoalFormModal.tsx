import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import type { Goal, NewGoalData } from '../types';
import { labelClass, primaryButtonClass, textInputClass } from '../styles/formStyles';
import { useCategories } from '../hooks/useCategories';

interface GoalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: NewGoalData) => Promise<void>;
  goalToEdit: Goal | null;
}

const GoalFormModal: React.FC<GoalFormModalProps> = ({ isOpen, onClose, onSave, goalToEdit }) => {
  const { t } = useTranslation();
  const { data: categories = [] } = useCategories();
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState<number | ''>('');
  const [categoryId, setCategoryId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Linked income transactions count toward a goal, so only income/both categories qualify.
  const linkableCategories = useMemo(
    () => categories.filter((c) => c.type === 'income' || c.type === 'both'),
    [categories],
  );

  useEffect(() => {
    if (isOpen) {
      if (goalToEdit) {
        setName(goalToEdit.name);
        setTargetAmount(goalToEdit.targetAmount);
        setCategoryId(goalToEdit.category?.id ?? '');
        setDeadline(goalToEdit.deadline ?? '');
      } else {
        setName('');
        setTargetAmount('');
        setCategoryId('');
        setDeadline('');
      }
      setError('');
      setIsLoading(false);
    }
  }, [isOpen, goalToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || targetAmount === '' || targetAmount <= 0) {
      setError(t('goalModal.validationError'));
      return;
    }
    setError('');
    setIsLoading(true);

    const data: NewGoalData = {
      name,
      targetAmount,
      categoryId: categoryId ? Number(categoryId) : null,
      deadline: deadline || undefined,
    };

    await onSave(data);
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg z-50">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
            {goalToEdit ? t('goalModal.editTitle') : t('goalModal.newTitle')}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="goal-name" className={`${labelClass} mb-1`}>
                {t('goalModal.nameLabel')}
              </label>
              <input
                type="text"
                id="goal-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('goalModal.namePlaceholder')}
                className={textInputClass}
              />
            </div>

            <div>
              <label htmlFor="goal-target" className={`${labelClass} mb-1`}>
                {t('goalModal.targetLabel')}
              </label>
              <input
                type="number"
                id="goal-target"
                min="0.01"
                step="0.01"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder={t('goalModal.targetPlaceholder')}
                className={textInputClass}
              />
            </div>

            <div>
              <label htmlFor="goal-category" className={`${labelClass} mb-1`}>
                {t('goalModal.categoryLabel')}
              </label>
              <select
                id="goal-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={textInputClass}
              >
                <option value="">{t('goalModal.categoryNone')}</option>
                {linkableCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('goalModal.categoryHint')}</p>
            </div>

            <div>
              <label htmlFor="goal-deadline" className={`${labelClass} mb-1`}>
                {t('goalModal.deadlineLabel')}
              </label>
              <input
                type="date"
                id="goal-deadline"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className={textInputClass}
              />
            </div>

            {error && <p className="text-danger-500 text-sm">{error}</p>}
          </div>

          <div className="mt-8">
            <button type="submit" disabled={isLoading} className={primaryButtonClass}>
              {isLoading ? t('goalModal.saving') : t('goalModal.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoalFormModal;
