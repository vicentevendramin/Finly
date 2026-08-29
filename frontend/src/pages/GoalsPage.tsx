import React from 'react';
import { useTranslation } from 'react-i18next';

const GoalsPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl">
      <h3 className="text-2xl font-semibold mb-6 text-gray-800">
        {t('goalsPage.title')}
      </h3>
      <div className="text-center text-gray-500 py-10">
        <p className="text-lg">{t('goalsPage.underConstruction')}</p>
        <p>{t('goalsPage.comingSoon')}</p>
      </div>
      {/* O componente <GoalsList /> que já existe poderia ser movido para cá */}
    </div>
  );
};

export default GoalsPage;
