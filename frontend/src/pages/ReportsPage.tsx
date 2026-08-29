import React from 'react';
import { useTranslation } from 'react-i18next';

const ReportsPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl">
      <h3 className="text-2xl font-semibold mb-6 text-gray-800">
        {t('reportsPage.title')}
      </h3>
      <div className="text-center text-gray-500 py-10">
        <p className="text-lg">{t('reportsPage.underConstruction')}</p>
        <p>{t('reportsPage.comingSoon')}</p>
      </div>
    </div>
  );
};

export default ReportsPage;
