import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import NewTransactionModal from '../components/NewTransactionModal';
import { useCreateTransaction, useUpdateTransaction } from '../hooks/useTransactions';
import { useUiStore } from '../store/uiStore';
import type { NewTransactionData } from '../types';

const AppLayout: React.FC = () => {
  const { t } = useTranslation();
  const isModalOpen = useUiStore((state) => state.isModalOpen);
  const editingTransaction = useUiStore((state) => state.editingTransaction);
  const closeModal = useUiStore((state) => state.closeModal);
  const openMobileMenu = useUiStore((state) => state.openMobileMenu);
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();

  const handleSaveTransaction = async (data: NewTransactionData) => {
    if (editingTransaction) {
      await updateTransaction.mutateAsync({ id: editingTransaction.id, data });
    } else {
      await createTransaction.mutateAsync(data);
    }
    closeModal();
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar (mobile only) */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={openMobileMenu}
            aria-label={t('sidebar.openMenu')}
            className="p-2 -ml-2 text-gray-600 dark:text-gray-300"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-primary-600 dark:text-primary-400">Finly</h1>
          <div className="w-10" />
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <NewTransactionModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSaveTransaction}
        transactionToEdit={editingTransaction}
      />
    </div>
  );
};

export default AppLayout;
