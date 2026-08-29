import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';

import CategoryChart from '../components/CategoryChart';
import GoalsList from '../components/GoalsList';
import { useDeleteTransaction, useTransactions } from '../hooks/useTransactions';
import { useUiStore } from '../store/uiStore';

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { data: transactions = [], isLoading } = useTransactions();
  const openEditModal = useUiStore((state) => state.openEditModal);
  const deleteTransaction = useDeleteTransaction();

  const handleDelete = (id: string) => {
    if (window.confirm(t('common.confirmDeleteTransaction'))) {
      deleteTransaction.mutate(id);
    }
  };

  const summary = transactions.reduce(
    (acc, tx) => {
      if (tx.type === 'income') {
        acc.totalReceitas += tx.amount;
      } else if (tx.type === 'expense') {
        acc.totalDespesas += tx.amount;
      }
      acc.saldoMes = acc.totalReceitas - acc.totalDespesas;
      return acc;
    },
    { totalReceitas: 0, totalDespesas: 0, saldoMes: 0 },
  );
  const isNegativeBalance = !isLoading && summary.saldoMes < 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Coluna Principal (esquerda) */}
      <div className="lg:col-span-2 space-y-8">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border-t-4 border-success-500">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">{t('dashboard.income')}</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-50 mt-2">
              {isLoading ? '...' : `R$ ${summary.totalReceitas.toFixed(2)}`}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border-t-4 border-danger-500">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">{t('dashboard.expenses')}</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-50 mt-2">
              {isLoading ? '...' : `R$ ${summary.totalDespesas.toFixed(2)}`}
            </p>
          </div>

          <div
            className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border-t-4 ${
              isNegativeBalance ? 'border-accent-500' : 'border-primary-500'
            }`}
          >
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">{t('dashboard.balance')}</h3>
            <p
              className={`text-3xl font-bold mt-2 ${
                isNegativeBalance ? 'text-accent-600 dark:text-accent-400' : 'text-gray-900 dark:text-gray-50'
              }`}
            >
              {isLoading ? '...' : `R$ ${summary.saldoMes.toFixed(2)}`}
            </p>
          </div>
        </div>

        {/* Lançamentos Recentes */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
            {t('dashboard.recentTransactions')}
          </h3>
          <div className="space-y-4">
            {isLoading ? (
              <p className="text-gray-500 dark:text-gray-400">{t('dashboard.loadingTransactions')}</p>
            ) : transactions.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">{t('dashboard.noTransactions')}</p>
            ) : (
              transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{tx.description}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{tx.category}</p>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <p className={`font-medium ${tx.type === 'income' ? 'text-success-600 dark:text-success-500' : 'text-danger-600 dark:text-danger-500'}`}>
                      {tx.type === 'income' ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-4 space-x-2">
                    <button
                      onClick={() => openEditModal(tx)}
                      className="text-primary-500 hover:text-primary-700 dark:hover:text-primary-400"
                      title={t('common.edit')}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="text-danger-500 hover:text-danger-700 dark:hover:text-danger-400"
                      title={t('common.delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Coluna Lateral (direita) */}
      <div className="lg:col-span-1 space-y-8">
        <CategoryChart />
        <GoalsList />
      </div>
    </div>
  );
};

export default DashboardPage;
