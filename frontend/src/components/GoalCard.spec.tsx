import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GoalCard from './GoalCard';
import { apiService } from '../services/apiService';
import { createQueryWrapper } from '../test/queryWrapper';
import type { Goal } from '../types';

vi.mock('../services/apiService', () => ({
  apiService: {
    addContribution: vi.fn(),
  },
}));

const goal: Goal = {
  id: '1',
  name: 'Dream trip',
  targetAmount: 2000,
  currentAmount: 450,
  category: 'Travel',
  deadline: null,
};

describe('GoalCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the progress percentage and amounts', () => {
    const { Wrapper } = createQueryWrapper();
    render(<GoalCard goal={goal} onEdit={vi.fn()} onDelete={vi.fn()} />, { wrapper: Wrapper });

    expect(screen.getByText('23%')).toBeInTheDocument();
    expect(screen.getByText('R$ 450.00 / R$ 2000.00')).toBeInTheDocument();
    expect(screen.getByText('Travel')).toBeInTheDocument();
  });

  it('caps progress at 100% when contributions exceed the target', () => {
    const { Wrapper } = createQueryWrapper();
    render(
      <GoalCard goal={{ ...goal, currentAmount: 3000 }} onEdit={vi.fn()} onDelete={vi.fn()} />,
      { wrapper: Wrapper },
    );

    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('calls onEdit and onDelete with the goal', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const { Wrapper } = createQueryWrapper();
    render(<GoalCard goal={goal} onEdit={onEdit} onDelete={onDelete} />, { wrapper: Wrapper });

    await user.click(screen.getByTitle('Editar'));
    expect(onEdit).toHaveBeenCalledWith(goal);

    await user.click(screen.getByTitle('Excluir'));
    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('submits a manual contribution and resets the form', async () => {
    const user = userEvent.setup();
    vi.mocked(apiService.addContribution).mockResolvedValue({ ...goal, currentAmount: 600 });
    const { Wrapper } = createQueryWrapper();
    render(<GoalCard goal={goal} onEdit={vi.fn()} onDelete={vi.fn()} />, { wrapper: Wrapper });

    await user.click(screen.getByText('Adicionar contribuição'));
    await user.type(screen.getByPlaceholderText('Valor'), '150');
    await user.click(screen.getByText('OK'));

    await waitFor(() =>
      expect(apiService.addContribution).toHaveBeenCalledWith('1', { amount: 150 }),
    );
    // Form collapses back to the "add contribution" link after a successful submit.
    expect(await screen.findByText('Adicionar contribuição')).toBeInTheDocument();
  });
});
