import React from 'react';
import { useTranslation } from 'react-i18next';

const CategoryChart: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl">
      <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">{t('dashboard.categoryChartTitle')}</h3>
      <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-700 rounded-lg">
        {/* A pie/donut chart (e.g. Recharts, Chart.js) would go here */}
        <p className="text-gray-500 dark:text-gray-400">{t('dashboard.categoryChartPlaceholder')} 📈</p>
      </div>
    </div>
  );
};

export default CategoryChart;
