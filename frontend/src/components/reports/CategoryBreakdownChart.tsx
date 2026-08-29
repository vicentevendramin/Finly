import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useThemeStore } from '../../store/themeStore';
import { getCategoryColor, getChartChrome } from '../../styles/chartColors';
import type { CategoryTotal } from '../../types';

interface CategoryBreakdownChartProps {
  data: CategoryTotal[];
  type: 'income' | 'expense';
  onTypeChange: (type: 'income' | 'expense') => void;
}

const MAX_SLICES = 7;

const CategoryBreakdownChart: React.FC<CategoryBreakdownChartProps> = ({ data, type, onTypeChange }) => {
  const { t } = useTranslation();
  const isDark = useThemeStore((state) => state.theme === 'dark');
  const chrome = getChartChrome(isDark);

  // Fold everything past the top 7 into "Other" (dataviz series-count ladder).
  const chartData = useMemo(() => {
    const sorted = [...data].sort((a, b) => b.total - a.total);
    if (sorted.length <= MAX_SLICES) return sorted;
    const head = sorted.slice(0, MAX_SLICES);
    const otherTotal = sorted.slice(MAX_SLICES).reduce((sum, row) => sum + row.total, 0);
    return [...head, { category: t('reportsPage.other'), total: otherTotal }];
  }, [data, t]);

  const allNames = useMemo(() => data.map((row) => row.category), [data]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {t('reportsPage.categoryBreakdownTitle')}
        </h4>
        <div className="flex gap-1">
          <button
            onClick={() => onTypeChange('expense')}
            className={`px-3 py-1 text-sm rounded-lg font-medium ${
              type === 'expense'
                ? 'bg-danger-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            {t('transactionModal.expense')}
          </button>
          <button
            onClick={() => onTypeChange('income')}
            className={`px-3 py-1 text-sm rounded-lg font-medium ${
              type === 'income'
                ? 'bg-success-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            {t('transactionModal.income')}
          </button>
        </div>
      </div>

      {chartData.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">{t('reportsPage.noData')}</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 40)}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 24 }}>
              <XAxis type="number" stroke={chrome.axisText} tick={{ fill: chrome.axisText, fontSize: 12 }} />
              <YAxis
                dataKey="category"
                type="category"
                width={110}
                stroke={chrome.axisText}
                tick={{ fill: chrome.axisText, fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: chrome.tooltipBg,
                  border: `1px solid ${chrome.tooltipBorder}`,
                  borderRadius: 8,
                  color: chrome.tooltipText,
                }}
                formatter={(value) => `R$ ${Number(value).toFixed(2)}`}
              />
              <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={24}>
                {chartData.map((entry) => (
                  <Cell key={entry.category} fill={getCategoryColor(entry.category, allNames, isDark)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400">
                  <th className="pr-4 py-1">{t('transactions.columns.category')}</th>
                  <th className="pr-4 py-1">{t('transactions.columns.amount')}</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 dark:text-gray-300">
                {chartData.map((row) => (
                  <tr key={row.category} className="border-t border-gray-100 dark:border-gray-700">
                    <td className="pr-4 py-1">{row.category}</td>
                    <td className="pr-4 py-1">R$ {row.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default CategoryBreakdownChart;
