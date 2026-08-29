import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, PlusCircle, Trash2 } from 'lucide-react';
import type { Goal } from '../types';
import { useAddContribution } from '../hooks/useGoals';
import { textInputClass } from '../styles/formStyles';

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const [isContributing, setIsContributing] = useState(false);
  const [amount, setAmount] = useState<number | ''>('');
  const addContribution = useAddContribution();

  const progress = goal.targetAmount > 0
    ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
    : 0;
  const isComplete = goal.currentAmount >= goal.targetAmount;

  const handleAddContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount === '' || amount <= 0) return;
    await addContribution.mutateAsync({ id: goal.id, data: { amount } });
    setAmount('');
    setIsContributing(false);
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5">
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{goal.name}</h4>
          <div className="mt-1 flex flex-wrap gap-2">
            {goal.category && (
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300">
                {goal.category}
              </span>
            )}
            {goal.deadline && (
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                {new Date(goal.deadline).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onEdit(goal)}
            className="text-primary-500 hover:text-primary-700 dark:hover:text-primary-400"
            title={t('common.edit')}
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(goal.id)}
            className="text-danger-500 hover:text-danger-700 dark:hover:text-danger-400"
            title={t('common.delete')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between items-center mb-1 text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            R$ {goal.currentAmount.toFixed(2)} / R$ {goal.targetAmount.toFixed(2)}
          </span>
          <span className={`font-semibold ${isComplete ? 'text-success-600 dark:text-success-500' : 'text-primary-600 dark:text-primary-400'}`}>
            {progress.toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full ${isComplete ? 'bg-success-500' : 'bg-primary-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-4">
        {isContributing ? (
          <form onSubmit={handleAddContribution} className="flex gap-2">
            <input
              type="number"
              min="0.01"
              step="0.01"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder={t('goalCard.contributionPlaceholder')}
              className={`${textInputClass} mt-0 py-2`}
            />
            <button
              type="submit"
              disabled={addContribution.isPending}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
            >
              {t('goalCard.confirm')}
            </button>
            <button
              type="button"
              onClick={() => setIsContributing(false)}
              className="px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              {t('goalCard.cancel')}
            </button>
          </form>
        ) : (
          <button
            onClick={() => setIsContributing(true)}
            className="flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
          >
            <PlusCircle className="w-4 h-4" />
            {t('goalCard.addContribution')}
          </button>
        )}
      </div>
    </div>
  );
};

export default GoalCard;
