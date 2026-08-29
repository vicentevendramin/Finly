import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { NewTransactionData, Transaction } from '../types';
import { X } from 'lucide-react';
import { labelClass, primaryButtonClass, textInputClass } from '../styles/formStyles';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: NewTransactionData) => Promise<void>;
  transactionToEdit: Transaction | null;
}

const NewTransactionModal: React.FC<ModalProps> = ({ isOpen, onClose, onSave, transactionToEdit }) => {
  const { t } = useTranslation();
  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Effect to fill the form when 'transactionToEdit' changes
  useEffect(() => {
    if (isOpen) {
      if (transactionToEdit) {
        // Edit mode: fill the form
        setDescription(transactionToEdit.description);
        setAmount(Math.abs(transactionToEdit.amount)); // Always use a positive value in the input
        setType(transactionToEdit.type);
        setCategory(transactionToEdit.category);
      } else {
        // Clear the form
        setDescription('');
        setAmount('');
        setType('expense');
        setCategory('');
      }
      setError('');
      setIsLoading(false);
    }
  }, [isOpen, transactionToEdit]); // Runs whenever the modal opens or the transaction changes

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
      amount: Math.abs(amount), // API always receives a positive value
      type,
      category,
    };

    // onSave (from App.tsx) now knows whether it's editing or saving
    await onSave(data);

    // App.tsx is now responsible for closing the modal
    // (onSave already calls handleCloseModal)
    setIsLoading(false);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow only digits and a single decimal point
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setAmount(val === '' ? '' : Number(val));
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    // Backdrop
    <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
      {/* Modal content */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg z-50">
        {/* Modal header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          {/* Dynamic title */}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Type (Income/Expense) */}
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

            {/* Amount */}
            <div>
              <label htmlFor="amount" className={`${labelClass} mb-1`}>
                {t('transactionModal.amountLabel')}
              </label>
              <input
                type="text" // Use 'text' to control the format
                id="amount"
                value={amount}
                onChange={handleAmountChange}
                placeholder={t('transactionModal.amountPlaceholder')}
                className={textInputClass}
              />
            </div>

            {/* Description */}
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

            {/* Category */}
            <div>
              <label htmlFor="category" className={`${labelClass} mb-1`}>
                {t('transactionModal.categoryLabel')}
              </label>
              <input
                type="text"
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder={t('transactionModal.categoryPlaceholder')}
                className={textInputClass}
              />
              {/* TODO: Replace with a <select> of predefined categories */}
            </div>

            {error && <p className="text-danger-500 text-sm">{error}</p>}
          </div>

          {/* Save button */}
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
