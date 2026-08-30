import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NewTransactionModal from './NewTransactionModal';
import { apiService } from '../services/apiService';
import { createQueryWrapper } from '../test/queryWrapper';
import type { Category, Transaction } from '../types';

vi.mock('../services/apiService', () => ({
  apiService: { getCategories: vi.fn() },
}));

const categories: Category[] = [
  { id: '10', name: 'Food', emoji: '🍔', color: '#ef4444', type: 'expense' },
  { id: '20', name: 'Salary', emoji: '💰', color: '#22c55e', type: 'income' },
  { id: '30', name: 'Gifts', emoji: '🎁', color: '#a855f7', type: 'both' },
];

const existingTransaction: Transaction = {
  id: '1',
  description: 'Rent',
  amount: 1500,
  date: '2026-08-01',
  type: 'expense',
  category: { id: '30', name: 'Gifts', emoji: '🎁', color: '#a855f7', type: 'both' },
};

function renderModal(props: Partial<React.ComponentProps<typeof NewTransactionModal>> = {}) {
  const { Wrapper } = createQueryWrapper();
  return render(
    <NewTransactionModal
      isOpen
      onClose={vi.fn()}
      onSave={vi.fn().mockResolvedValue(undefined)}
      transactionToEdit={null}
      {...props}
    />,
    { wrapper: Wrapper },
  );
}

describe('NewTransactionModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiService.getCategories).mockResolvedValue(categories);
  });

  it('renders nothing when closed', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('shows a validation error when amount/description are missing', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    renderModal({ onSave });

    await user.click(screen.getByRole('button', { name: /salvar transação/i }));

    expect(await screen.findByText('Por favor, preencha valor e descrição.')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('only offers categories matching the selected income/expense type', async () => {
    const user = userEvent.setup();
    renderModal();

    // expense is the default — Food + Gifts (both), not Salary
    await waitFor(() => expect(screen.getByRole('option', { name: /Food/ })).toBeInTheDocument());
    expect(screen.queryByRole('option', { name: /Salary/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Receita' }));
    await waitFor(() => expect(screen.getByRole('option', { name: /Salary/ })).toBeInTheDocument());
    expect(screen.queryByRole('option', { name: /Food/ })).not.toBeInTheDocument();
  });

  it('submits categoryId (or null) with the entered data', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderModal({ onSave });

    await user.type(screen.getByLabelText(/valor/i), '250');
    await user.type(screen.getByLabelText(/descrição/i), 'Groceries');
    await waitFor(() => expect(screen.getByRole('option', { name: /Food/ })).toBeInTheDocument());
    await user.selectOptions(screen.getByLabelText(/categoria/i), '10');
    await user.click(screen.getByRole('button', { name: /salvar transação/i }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        description: 'Groceries',
        amount: 250,
        type: 'expense',
        categoryId: 10,
      }),
    );
  });

  it('pre-fills the category select when editing', async () => {
    renderModal({ transactionToEdit: existingTransaction });

    expect(screen.getByDisplayValue('Rent')).toBeInTheDocument();
    await waitFor(() =>
      expect((screen.getByLabelText(/categoria/i) as HTMLSelectElement).value).toBe('30'),
    );
    expect(screen.getByRole('heading', { name: 'Editar Transação' })).toBeInTheDocument();
  });
});
