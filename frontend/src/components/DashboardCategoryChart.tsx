import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTransactions } from '../hooks/useTransactions';
import { useThemeStore } from '../store/themeStore';
import { getChartChrome } from '../styles/chartColors';

const MAX_SLICES = 7;

/** Current-month expenses grouped by category, coloured by each category's own colour. */
const DashboardCategoryChart: React.FC = () => {
  const { t } = useTranslation();
  const { data: transactions = [], isLoading } = useTransactions();
  const isDark = useThemeStore((state) => state.theme === 'dark');
  const chrome = getChartChrome(isDark);
  const uncategorizedColor = isDark ? '#6b7280' : '#9ca3af';

  const currentMonth = new Date().toISOString().slice(0, 7);

  const rows = useMemo(() => {
    const totals = new Map<string, { name: string; color: string; total: number }>();
    for (const tx of transactions) {
      if (tx.type !== 'expense' || !tx.date.startsWith(currentMonth)) continue;
      const key = tx.category?.id ?? 'uncategorized';
      const name = tx.category
        ? `${tx.category.emoji} ${tx.category.name}`
        : t('categories.uncategorized');
      const color = tx.category?.color ?? uncategorizedColor;
      const current = totals.get(key) ?? { name, color, total: 0 };
      current.total += tx.amount;
      totals.set(key, current);
    }
    const sorted = [...totals.values()].sort((a, b) => b.total - a.total);
    if (sorted.length <= MAX_SLICES) return sorted;
    const head = sorted.slice(0, MAX_SLICES);
    const otherTotal = sorted.slice(MAX_SLICES).reduce((sum, r) => sum + r.total, 0);
    return [...head, { name: t('reportsPage.other'), color: uncategorizedColor, total: otherTotal }];
  }, [transactions, currentMonth, t, uncategorizedColor]);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl">
      <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
        {t('dashboard.categoryChartTitle')}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {t('dashboard.categoryChartSubtitle')}
      </p>

      {isLoading ? (
        <p className="text-gray-500 dark:text-gray-400">{t('dashboard.loadingTransactions')}</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">{t('dashboard.categoryChartEmpty')}</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={Math.max(160, rows.length * 40)}>
            <BarChart data={rows} layout="vertical" margin={{ left: 12 }}>
              <XAxis
                type="number"
                stroke={chrome.axisText}
                tick={{ fill: chrome.axisText, fontSize: 12 }}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={120}
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
                {rows.map((row) => (
                  <Cell key={row.name} fill={row.color} />
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
                {rows.map((row) => (
                  <tr key={row.name} className="border-t border-gray-100 dark:border-gray-700">
                    <td className="pr-4 py-1">{row.name}</td>
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

export default DashboardCategoryChart;
