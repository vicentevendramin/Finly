import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useThemeStore } from '../../store/themeStore';
import { getChartChrome, getFlowColors } from '../../styles/chartColors';
import type { BalancePeriod } from '../../types';

interface BalanceChartProps {
  data: BalancePeriod[];
  title: string;
}

const BalanceChart: React.FC<BalanceChartProps> = ({ data, title }) => {
  const { t } = useTranslation();
  const isDark = useThemeStore((state) => state.theme === 'dark');
  const flow = getFlowColors(isDark);
  const chrome = getChartChrome(isDark);

  return (
    <div>
      <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">{title}</h4>
      {data.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">{t('reportsPage.noData')}</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} barGap={2} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke={chrome.grid} vertical={false} />
              <XAxis dataKey="period" stroke={chrome.axisText} tick={{ fill: chrome.axisText, fontSize: 12 }} />
              <YAxis stroke={chrome.axisText} tick={{ fill: chrome.axisText, fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: chrome.tooltipBg,
                  border: `1px solid ${chrome.tooltipBorder}`,
                  borderRadius: 8,
                  color: chrome.tooltipText,
                }}
                formatter={(value) => `R$ ${Number(value).toFixed(2)}`}
              />
              <Legend wrapperStyle={{ color: chrome.axisText, fontSize: 12 }} />
              <Bar dataKey="income" name={t('dashboard.income')} fill={flow.income} radius={[4, 4, 0, 0]} maxBarSize={24} />
              <Bar dataKey="expense" name={t('dashboard.expenses')} fill={flow.expense} radius={[4, 4, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>

          {/* Table view — same data, for accessibility and screen readers */}
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400">
                  <th className="pr-4 py-1">{t('reportsPage.period')}</th>
                  <th className="pr-4 py-1">{t('dashboard.income')}</th>
                  <th className="pr-4 py-1">{t('dashboard.expenses')}</th>
                  <th className="pr-4 py-1">{t('dashboard.balance')}</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 dark:text-gray-300">
                {data.map((row) => (
                  <tr key={row.period} className="border-t border-gray-100 dark:border-gray-700">
                    <td className="pr-4 py-1">{row.period}</td>
                    <td className="pr-4 py-1">R$ {row.income.toFixed(2)}</td>
                    <td className="pr-4 py-1">R$ {row.expense.toFixed(2)}</td>
                    <td className={`pr-4 py-1 font-medium ${row.balance < 0 ? 'text-accent-600 dark:text-accent-400' : ''}`}>
                      R$ {row.balance.toFixed(2)}
                    </td>
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

export default BalanceChart;
