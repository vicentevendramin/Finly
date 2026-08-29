import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import NewTransactionModal from '../components/NewTransactionModal';
import { useCreateTransaction, useUpdateTransaction } from '../hooks/useTransactions';
import { useUiStore } from '../store/uiStore';
import type { NewTransactionData } from '../types';

const AppLayout: React.FC = () => {
  const isModalOpen = useUiStore((state) => state.isModalOpen);
  const editingTransaction = useUiStore((state) => state.editingTransaction);
  const closeModal = useUiStore((state) => state.closeModal);
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
    <div className="flex h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <Outlet />
      </main>

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
