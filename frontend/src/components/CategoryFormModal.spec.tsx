import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import CategoryFormModal from './CategoryFormModal';
import type { Category } from '../types';

// The lazy EmojiPicker pulls in the emoji-mart web component — stub it out.
vi.mock('./EmojiPicker', () => ({
  default: ({ onSelect }: { onSelect: (e: string) => void }) => (
    <button onClick={() => onSelect('🎯')}>pick</button>
  ),
}));

const existing: Category = {
  id: '5',
  name: 'Groceries',
  emoji: '🛒',
  color: '#00ff00',
  type: 'expense',
};

describe('CategoryFormModal', () => {
  it('validates name/emoji/colour before saving', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <CategoryFormModal isOpen onClose={vi.fn()} onSave={onSave} categoryToEdit={null} />,
    );

    // name empty -> blocked
    await user.click(screen.getByRole('button', { name: 'Salvar Categoria' }));
    expect(await screen.findByText(/nome, um emoji e uma cor/i)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('submits the trimmed, lowercased payload', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <CategoryFormModal isOpen onClose={vi.fn()} onSave={onSave} categoryToEdit={null} />,
    );

    await user.type(screen.getByLabelText('Nome'), 'Coffee');
    await user.click(screen.getByRole('button', { name: 'Receita' }));
    await user.click(screen.getByRole('button', { name: 'Salvar Categoria' }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Coffee', type: 'income', color: '#2563eb' }),
      ),
    );
  });

  it('pre-fills fields when editing', () => {
    render(
      <CategoryFormModal isOpen onClose={vi.fn()} onSave={vi.fn()} categoryToEdit={existing} />,
    );
    expect(screen.getByDisplayValue('Groceries')).toBeInTheDocument();
    expect((screen.getByLabelText('Cor') as HTMLInputElement).value).toBe('#00ff00');
    expect(screen.getByRole('heading', { name: 'Editar Categoria' })).toBeInTheDocument();
  });
});
