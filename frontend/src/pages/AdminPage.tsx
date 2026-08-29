import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReportDateFilter from '../components/reports/ReportDateFilter';
import { useAdminErrors, useAdminStats } from '../hooks/useAdmin';
import type { ReportDateRange } from '../types';

const AdminPage: React.FC = () => {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState<ReportDateRange>({});
  const { data: stats, isLoading: statsLoading } = useAdminStats(dateRange.from, dateRange.to);
  const { data: errors = [], isLoading: errorsLoading } = useAdminErrors();

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl">
        <h3 className="text-2xl font-semibold mb-2 text-gray-800 dark:text-gray-100">
          {t('adminPage.title')}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('adminPage.filterHint')}</p>
        <ReportDateFilter value={dateRange} onChange={setDateRange} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border-t-4 border-primary-500">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">
            {t('adminPage.totalUsers')}
          </h4>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-50 mt-2">
            {statsLoading ? '...' : stats?.totalUsers}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border-t-4 border-success-500">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">
            {t('adminPage.newUsers')}
          </h4>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-50 mt-2">
            {statsLoading ? '...' : stats?.newUsers}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border-t-4 border-primary-500">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">
            {t('adminPage.totalTransactions')}
          </h4>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-50 mt-2">
            {statsLoading ? '...' : stats?.totalTransactions}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border-t-4 border-success-500">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">
            {t('adminPage.transactionsInPeriod')}
          </h4>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-50 mt-2">
            {statsLoading ? '...' : stats?.transactionsInPeriod}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          {t('adminPage.recentErrors')}
        </h4>
        {errorsLoading ? (
          <p className="text-gray-500 dark:text-gray-400">{t('adminPage.loading')}</p>
        ) : errors.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">{t('adminPage.noErrors')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400">
                  <th className="pr-4 py-2">{t('adminPage.columns.date')}</th>
                  <th className="pr-4 py-2">{t('adminPage.columns.path')}</th>
                  <th className="pr-4 py-2">{t('adminPage.columns.message')}</th>
                  <th className="pr-4 py-2">{t('adminPage.columns.user')}</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 dark:text-gray-300">
                {errors.map((err) => (
                  <tr key={err.id} className="border-t border-gray-100 dark:border-gray-700">
                    <td className="pr-4 py-2 whitespace-nowrap">{new Date(err.createdAt).toLocaleString()}</td>
                    <td className="pr-4 py-2 whitespace-nowrap">{err.path}</td>
                    <td className="pr-4 py-2 text-danger-600 dark:text-danger-500">{err.message}</td>
                    <td className="pr-4 py-2 whitespace-nowrap">{err.userId ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
