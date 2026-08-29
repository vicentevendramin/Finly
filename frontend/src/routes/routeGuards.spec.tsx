import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import ProtectedRoute from './ProtectedRoute';
import PublicOnlyRoute from './PublicOnlyRoute';
import AdminRoute from './AdminRoute';
import { useAuthStore } from '../store/authStore';
import type { User } from '../types';

const regularUser: User = { id: '1', email: 'user@example.com', role: 'user' };
const adminUser: User = { id: '2', email: 'admin@example.com', role: 'admin' };

function renderWithRoute(
  guard: React.ReactElement,
  { initialEntry = '/protected', guardedPath = '/protected' } = {},
) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={guard}>
          <Route path={guardedPath} element={<div>Guarded content</div>} />
        </Route>
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/app/dashboard" element={<div>Dashboard page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  afterEach(() => useAuthStore.setState({ user: null }));

  it('redirects to /login when there is no user', () => {
    useAuthStore.setState({ user: null });
    renderWithRoute(<ProtectedRoute />);

    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Guarded content')).not.toBeInTheDocument();
  });

  it('renders the guarded content when a user is logged in', () => {
    useAuthStore.setState({ user: regularUser });
    renderWithRoute(<ProtectedRoute />);

    expect(screen.getByText('Guarded content')).toBeInTheDocument();
  });
});

describe('PublicOnlyRoute', () => {
  afterEach(() => useAuthStore.setState({ user: null }));

  it('renders the guarded content when there is no user', () => {
    useAuthStore.setState({ user: null });
    renderWithRoute(<PublicOnlyRoute />, { initialEntry: '/protected', guardedPath: '/protected' });

    expect(screen.getByText('Guarded content')).toBeInTheDocument();
  });

  it('redirects to /app/dashboard when a user is already logged in', () => {
    useAuthStore.setState({ user: regularUser });
    renderWithRoute(<PublicOnlyRoute />);

    expect(screen.getByText('Dashboard page')).toBeInTheDocument();
    expect(screen.queryByText('Guarded content')).not.toBeInTheDocument();
  });
});

describe('AdminRoute', () => {
  afterEach(() => useAuthStore.setState({ user: null }));

  it('redirects a regular user to /app/dashboard', () => {
    useAuthStore.setState({ user: regularUser });
    renderWithRoute(<AdminRoute />);

    expect(screen.getByText('Dashboard page')).toBeInTheDocument();
    expect(screen.queryByText('Guarded content')).not.toBeInTheDocument();
  });

  it('redirects a logged-out visitor to /app/dashboard', () => {
    useAuthStore.setState({ user: null });
    renderWithRoute(<AdminRoute />);

    expect(screen.getByText('Dashboard page')).toBeInTheDocument();
  });

  it('renders the guarded content for an admin user', () => {
    useAuthStore.setState({ user: adminUser });
    renderWithRoute(<AdminRoute />);

    expect(screen.getByText('Guarded content')).toBeInTheDocument();
  });
});
