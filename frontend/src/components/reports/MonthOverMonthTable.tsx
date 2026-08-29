import React from 'react';
import { useTranslation } from 'react-i18next';
import type { BalancePeriod } from '../../types';

interface MonthOverMonthTableProps {
  data: BalancePeriod[];
  months: number;
  onMonthsChange: (months: number) => void;
}

const MONTH_OPTIONS = [3, 6, 12];

const MonthOverMonthTable: React.FC<MonthOverMonthTableProps> = ({ data, months, onMonthsChange }) => {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {t('reportsPage.monthOverMonthTitle')}
        </h4>
        <select
          value={months}
          onChange={(e) => onMonthsChange(Number(e.target.value))}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          {MONTH_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {t('reportsPage.lastNMonths', { count: n })}
            </option>
          ))}
        </select>
      </div>

      {data.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">{t('reportsPage.noData')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400">
                <th className="pr-4 py-2">{t('reportsPage.period')}</th>
                <th className="pr-4 py-2">{t('dashboard.income')}</th>
                <th className="pr-4 py-2">{t('dashboard.expenses')}</th>
                <th className="pr-4 py-2">{t('dashboard.balance')}</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 dark:text-gray-300">
              {data.map((row) => (
                <tr key={row.period} className="border-t border-gray-100 dark:border-gray-700">
                  <td className="pr-4 py-2">{row.period}</td>
                  <td className="pr-4 py-2 text-success-600 dark:text-success-500">R$ {row.income.toFixed(2)}</td>
                  <td className="pr-4 py-2 text-danger-600 dark:text-danger-500">R$ {row.expense.toFixed(2)}</td>
                  <td
                    className={`pr-4 py-2 font-semibold ${
                      row.balance < 0
                        ? 'text-accent-600 dark:text-accent-400'
                        : 'text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    R$ {row.balance.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MonthOverMonthTable;
