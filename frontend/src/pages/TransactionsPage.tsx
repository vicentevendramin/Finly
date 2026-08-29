import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useDeleteTransaction, useTransactions } from '../hooks/useTransactions';
import { useUiStore } from '../store/uiStore';

const TransactionsPage: React.FC = () => {
  const { data: transactions = [], isLoading, isError } = useTransactions();
  const openEditModal = useUiStore((state) => state.openEditModal);
  const deleteTransaction = useDeleteTransaction();

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
      deleteTransaction.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-xl">
        <h3 className="text-2xl font-semibold mb-6 text-gray-800">
          Todas as Transações
        </h3>
        <p className="text-gray-500">Carregando transações...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-xl">
        <p className="text-red-500">Falha ao carregar transações.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl">
      <h3 className="text-2xl font-semibold mb-6 text-gray-800">
        Todas as Transações
      </h3>
      <div className="space-y-4">
        {transactions.length === 0 ? (
          <p className="text-gray-500">Nenhuma transação encontrada.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{t.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      {t.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{new Date(t.date).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => openEditModal(t)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Editar"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Excluir"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TransactionsPage;
