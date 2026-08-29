import React from 'react';
import { useTranslation } from 'react-i18next';

const GoalsPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl">
      <h3 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-100">
        {t('goalsPage.title')}
      </h3>
      <div className="text-center text-gray-500 dark:text-gray-400 py-10">
        <p className="text-lg">{t('goalsPage.underConstruction')}</p>
        <p>{t('goalsPage.comingSoon')}</p>
      </div>
      {/* O componente <GoalsList /> que já existe poderia ser movido para cá */}
    </div>
  );
};

export default GoalsPage;
