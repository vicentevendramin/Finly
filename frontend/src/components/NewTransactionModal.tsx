import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { NewTransactionData, Transaction } from '../types';
import { X } from 'lucide-react';
import { labelClass, primaryButtonClass, textInputClass } from '../styles/formStyles';
import { useCategories } from '../hooks/useCategories';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: NewTransactionData) => Promise<void>;
  transactionToEdit: Transaction | null;
}

const NewTransactionModal: React.FC<ModalProps> = ({ isOpen, onClose, onSave, transactionToEdit }) => {
  const { t } = useTranslation();
  const { data: categories = [] } = useCategories();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const availableCategories = useMemo(
    () => categories.filter((c) => c.type === type || c.type === 'both'),
    [categories, type],
  );

  useEffect(() => {
    if (!isOpen) return;
    if (transactionToEdit) {
      setDescription(transactionToEdit.description);
      setAmount(Math.abs(transactionToEdit.amount));
      setType(transactionToEdit.type);
      setCategoryId(transactionToEdit.category?.id ?? '');
    } else {
      setDescription('');
      setAmount('');
      setType('expense');
      setCategoryId('');
    }
    setError('');
    setIsLoading(false);
  }, [isOpen, transactionToEdit]);

  // Once categories have loaded, drop a selection that no longer fits the chosen type.
  useEffect(() => {
    if (
      categoryId &&
      categories.length > 0 &&
      !availableCategories.some((c) => c.id === categoryId)
    ) {
      setCategoryId('');
    }
  }, [categories.length, availableCategories, categoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || amount === '' || amount === 0) {
      setError(t('transactionModal.validationError'));
      return;
    }
    setError('');
    setIsLoading(true);

    const data: NewTransactionData = {
      description,
      amount: Math.abs(amount),
      type,
      categoryId: categoryId ? Number(categoryId) : null,
    };

    await onSave(data);
    setIsLoading(false);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setAmount(val === '' ? '' : Number(val));
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg z-50">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
            {transactionToEdit ? t('transactionModal.editTitle') : t('transactionModal.newTitle')}
          </h3>
          <button
            onClick={onClose}
            aria-label={t('common.close')}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-3 rounded-lg font-semibold ${
                  type === 'expense'
                    ? 'bg-danger-600 text-white shadow-lg'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {t('transactionModal.expense')}
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-3 rounded-lg font-semibold ${
                  type === 'income'
                    ? 'bg-success-600 text-white shadow-lg'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {t('transactionModal.income')}
              </button>
            </div>

            <div>
              <label htmlFor="amount" className={`${labelClass} mb-1`}>
                {t('transactionModal.amountLabel')}
              </label>
              <input
                type="text"
                id="amount"
                value={amount}
                onChange={handleAmountChange}
                placeholder={t('transactionModal.amountPlaceholder')}
                className={textInputClass}
              />
            </div>

            <div>
              <label htmlFor="description" className={`${labelClass} mb-1`}>
                {t('transactionModal.descriptionLabel')}
              </label>
              <input
                type="text"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('transactionModal.descriptionPlaceholder')}
                className={textInputClass}
              />
            </div>

            <div>
              <label htmlFor="category" className={`${labelClass} mb-1`}>
                {t('transactionModal.categoryLabel')}
              </label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={textInputClass}
              >
                <option value="">{t('transactionModal.categoryNone')}</option>
                {availableCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.emoji} {category.name}
                  </option>
                ))}
              </select>
              {categories.length === 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('transactionModal.noCategoriesHint')}
                </p>
              )}
            </div>

            {error && <p className="text-danger-500 text-sm">{error}</p>}
          </div>

          <div className="mt-8">
            <button type="submit" disabled={isLoading} className={primaryButtonClass}>
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
