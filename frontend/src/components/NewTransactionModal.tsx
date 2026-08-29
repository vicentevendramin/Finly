import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { NewTransactionData, Transaction } from '../types';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: NewTransactionData) => Promise<void>;
  transactionToEdit: Transaction | null;
}

const NewTransactionModal: React.FC<ModalProps> = ({ isOpen, onClose, onSave, transactionToEdit }) => {
  const { t } = useTranslation();
  // Estado do formulário
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Efeito para preencher o formulário quando 'transactionToEdit' mudar
  useEffect(() => {
    if (isOpen) {
      if (transactionToEdit) {
        // Modo Edição: preenche o formulário
        setDescription(transactionToEdit.description);
        setAmount(Math.abs(transactionToEdit.amount)); // Usamos sempre valor positivo no input
        setType(transactionToEdit.type);
        setCategory(transactionToEdit.category);
      } else {
        // Limpa o formulário
        setDescription('');
        setAmount('');
        setType('expense');
        setCategory('');
      }
      setError('');
      setIsLoading(false);
    }
  }, [isOpen, transactionToEdit]); // Roda sempre que o modal abre ou a transação muda

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || amount === '' || amount === 0 || !category) {
      setError(t('transactionModal.validationError'));
      return;
    }
    setError('');
    setIsLoading(true);

    const data: NewTransactionData = {
      description,
      amount: Math.abs(amount), // API sempre recebe valor positivo
      type,
      category,
    };
    
    // O onSave (do App.tsx) agora sabe se está editando ou salvando
    await onSave(data);
    
    // O App.tsx agora é responsável por fechar o modal
    // (onSave já chama handleCloseModal)
    setIsLoading(false);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Permite apenas números e um ponto decimal
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setAmount(val === '' ? '' : Number(val));
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    // Backdrop
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
      {/* Conteúdo do Modal */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg z-50">
        {/* Header do Modal */}
        <div className="flex justify-between items-center p-6 border-b">
          {/* ítulo dinâmico */}
          <h3 className="text-2xl font-semibold text-gray-800">
            {transactionToEdit ? t('transactionModal.editTitle') : t('transactionModal.newTitle')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Tipo (Receita/Despesa) */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-3 rounded-lg font-semibold ${
                  type === 'expense'
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t('transactionModal.expense')}
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-3 rounded-lg font-semibold ${
                  type === 'income'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t('transactionModal.income')}
              </button>
            </div>

            {/* Valor */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                {t('transactionModal.amountLabel')}
              </label>
              <input
                type="text" // Usamos 'text' para controlar o formato
                id="amount"
                value={amount}
                onChange={handleAmountChange}
                placeholder={t('transactionModal.amountPlaceholder')}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Descrição */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                {t('transactionModal.descriptionLabel')}
              </label>
              <input
                type="text"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('transactionModal.descriptionPlaceholder')}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Categoria */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                {t('transactionModal.categoryLabel')}
              </label>
              <input
                type="text"
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder={t('transactionModal.categoryPlaceholder')}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {/* TODO: Substituir por um <select> com categorias pré-definidas */}
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>

          {/* Botão Salvar */}
          <div className="mt-8">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading
                ? t('transactionModal.saving')
                : transactionToEdit
                  ? t('transactionModal.saveChanges')
                  : t('transactionModal.saveNew')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTransactionModal;
