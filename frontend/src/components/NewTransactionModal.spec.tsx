import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import NewTransactionModal from './NewTransactionModal';
import type { Transaction } from '../types';

const existingTransaction: Transaction = {
  id: '1',
  description: 'Aluguel',
  amount: 1500,
  date: '2026-08-01',
  type: 'expense',
  category: 'Moradia',
};

describe('NewTransactionModal', () => {
  it('renders nothing when closed', () => {
    render(
      <NewTransactionModal isOpen={false} onClose={vi.fn()} onSave={vi.fn()} transactionToEdit={null} />,
    );
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('shows a validation error and does not call onSave when required fields are missing', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<NewTransactionModal isOpen onClose={vi.fn()} onSave={onSave} transactionToEdit={null} />);

    await user.click(screen.getByRole('button', { name: /salvar transação/i }));

    expect(await screen.findByText('Por favor, preencha todos os campos.')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('submits the form with the entered data for a new transaction', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<NewTransactionModal isOpen onClose={vi.fn()} onSave={onSave} transactionToEdit={null} />);

    await user.type(screen.getByLabelText(/valor/i), '250');
    await user.type(screen.getByLabelText(/descrição/i), 'Mercado');
    await user.type(screen.getByLabelText(/categoria/i), 'Alimentação');
    await user.click(screen.getByRole('button', { name: /salvar transação/i }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        description: 'Mercado',
        amount: 250,
        type: 'expense',
        category: 'Alimentação',
      }),
    );
  });

  it('pre-fills the form when editing an existing transaction', () => {
    render(
      <NewTransactionModal
        isOpen
        onClose={vi.fn()}
        onSave={vi.fn()}
        transactionToEdit={existingTransaction}
      />,
    );

    expect(screen.getByDisplayValue('Aluguel')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1500')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Moradia')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Editar Transação' })).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<NewTransactionModal isOpen onClose={onClose} onSave={vi.fn()} transactionToEdit={null} />);

    await user.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(onClose).toHaveBeenCalled();
  });
});
