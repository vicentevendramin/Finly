import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SettingsPage from './SettingsPage';
import { apiService } from '../services/apiService';
import { createQueryWrapper } from '../test/queryWrapper';
import { useAuthStore } from '../store/authStore';

vi.mock('../services/apiService', () => ({
  apiService: {
    getProfile: vi.fn(),
    getAvatarBlob: vi.fn(),
    updateWork: vi.fn(),
  },
}));

const emptyProfile = {
  displayName: null,
  phone: null,
  hasAvatar: false,
  avatarUpdatedAt: null,
  employmentStatus: null,
  incomeAmount: null,
  incomeFrequency: null,
  payDay: null,
  monthlyIncome: null,
};

function renderPage() {
  const { Wrapper } = createQueryWrapper();
  return render(
    <MemoryRouter initialEntries={['/app/settings']}>
      <SettingsPage />
    </MemoryRouter>,
    { wrapper: Wrapper },
  );
}

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: { id: '1', email: 'me@example.com', role: 'user', displayName: null } });
    vi.mocked(apiService.getProfile).mockResolvedValue(emptyProfile);
  });

  it('shows the four tabs and defaults to Profile', async () => {
    renderPage();

    for (const tab of ['Perfil', 'Trabalho e Renda', 'Preferências', 'Segurança']) {
      expect(screen.getByRole('button', { name: tab })).toBeInTheDocument();
    }
    expect(await screen.findByLabelText('Nome de exibição')).toBeInTheDocument();
  });

  it('switches to the Work & Income tab', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Trabalho e Renda' }));

    await waitFor(() =>
      expect(screen.getByLabelText('Situação profissional')).toBeInTheDocument(),
    );
  });

  it('renders the Security tab password form', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Segurança' }));

    expect(await screen.findByLabelText('Nova senha')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirmar nova senha')).toBeInTheDocument();
  });
});
