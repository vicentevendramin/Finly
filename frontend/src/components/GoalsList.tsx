import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useGoals } from '../hooks/useGoals';

const GoalsList: React.FC = () => {
  const { t } = useTranslation();
  const { data: goals = [], isLoading } = useGoals();
  const topGoals = goals.slice(0, 3);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('dashboard.goalsTitle')}</h3>
        <Link to="/app/goals" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">
          {t('dashboard.viewAll')}
        </Link>
      </div>

      {isLoading ? (
        <p className="text-gray-500 dark:text-gray-400">{t('dashboard.loadingTransactions')}</p>
      ) : topGoals.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">{t('goalsPage.empty')}</p>
      ) : (
        <ul className="space-y-6">
          {topGoals.map((goal) => {
            const progress = goal.targetAmount > 0
              ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
              : 0;
            return (
              <li key={goal.id}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300 truncate">{goal.name}</span>
                  <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                    {progress.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-primary-500 h-2.5 rounded-full"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-right text-sm text-gray-500 dark:text-gray-400 mt-1">
                  R$ {goal.currentAmount.toFixed(2)} / R$ {goal.targetAmount.toFixed(2)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default GoalsList;
