import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReportDateFilter from '../components/reports/ReportDateFilter';
import BalanceChart from '../components/reports/BalanceChart';
import CategoryBreakdownChart from '../components/reports/CategoryBreakdownChart';
import MonthOverMonthTable from '../components/reports/MonthOverMonthTable';
import ReportExportButtons from '../components/reports/ReportExportButtons';
import { useBalanceReport, useCategoryReport, useMonthOverMonth } from '../hooks/useReports';
import type { ReportDateRange } from '../types';

const ReportsPage: React.FC = () => {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState<ReportDateRange>({});
  const [categoryType, setCategoryType] = useState<'income' | 'expense'>('expense');
  const [months, setMonths] = useState(6);

  const balanceQuery = useBalanceReport(dateRange.from, dateRange.to);
  const categoryQuery = useCategoryReport(categoryType, dateRange.from, dateRange.to);
  const monthOverMonthQuery = useMonthOverMonth(months);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl">
        <div className="flex flex-wrap justify-between items-end gap-4 mb-2">
          <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
            {t('reportsPage.title')}
          </h3>
          <ReportExportButtons dateRange={dateRange} />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('reportsPage.filterHint')}</p>
        <ReportDateFilter value={dateRange} onChange={setDateRange} />
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl">
        <BalanceChart
          data={balanceQuery.data ?? []}
          title={t('reportsPage.balanceTitle')}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl">
        <CategoryBreakdownChart
          data={categoryQuery.data ?? []}
          type={categoryType}
          onTypeChange={setCategoryType}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl">
        <MonthOverMonthTable
          data={monthOverMonthQuery.data ?? []}
          months={months}
          onMonthsChange={setMonths}
        />
      </div>
    </div>
  );
};

export default ReportsPage;
