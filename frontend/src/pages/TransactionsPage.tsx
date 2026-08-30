import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';
import { useDeleteTransaction, useTransactions } from '../hooks/useTransactions';
import { useUiStore } from '../store/uiStore';
import type { Transaction } from '../types';
import CategoryBadge from '../components/CategoryBadge';

const TransactionsPage: React.FC = () => {
  const { t } = useTranslation();
  const { data: transactions = [], isLoading, isError } = useTransactions();
  const openEditModal = useUiStore((state) => state.openEditModal);
  const deleteTransaction = useDeleteTransaction();

  const handleDelete = (id: string) => {
    if (window.confirm(t('common.confirmDeleteTransaction'))) {
      deleteTransaction.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl">
        <h3 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-100">
          {t('transactions.title')}
        </h3>
        <p className="text-gray-500 dark:text-gray-400">{t('transactions.loading')}</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl">
        <p className="text-danger-500">{t('transactions.loadError')}</p>
      </div>
    );
  }

  const actionButtons = (tx: Transaction) => (
    <div className="flex items-center gap-2">
      <button
        onClick={() => openEditModal(tx)}
        className="text-primary-600 hover:text-primary-900 dark:hover:text-primary-400"
        title={t('common.edit')}
      >
        <Pencil className="w-5 h-5" />
      </button>
      <button
        onClick={() => handleDelete(tx.id)}
        className="text-danger-600 hover:text-danger-900 dark:hover:text-danger-400"
        title={t('common.delete')}
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl">
      <h3 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-100">
        {t('transactions.title')}
      </h3>
      {transactions.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">{t('transactions.empty')}</p>
      ) : (
        <>
          {/* Mobile: stacked cards */}
          <div className="space-y-3 sm:hidden">
            {transactions.map((tx) => (
              <div key={tx.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{tx.description}</p>
                    <span className="mt-1 inline-block">
                      <CategoryBadge category={tx.category} />
                    </span>
                  </div>
                  <p className={`font-medium whitespace-nowrap ${tx.type === 'income' ? 'text-success-600 dark:text-success-500' : 'text-danger-600 dark:text-danger-500'}`}>
                    {tx.type === 'income' ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                  </p>
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(tx.date).toLocaleDateString()}
                  </span>
                  {actionButtons(tx)}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop/tablet: table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/40">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('transactions.columns.description')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('transactions.columns.amount')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('transactions.columns.category')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('transactions.columns.date')}</th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">{t('transactions.columns.actions')}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{tx.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${tx.type === 'income' ? 'text-success-600 dark:text-success-500' : 'text-danger-600 dark:text-danger-500'}`}>
                        {tx.type === 'income' ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <CategoryBadge category={tx.category} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">{new Date(tx.date).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end">{actionButtons(tx)}</div>
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

export default TransactionsPage;
