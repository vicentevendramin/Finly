import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiService } from './apiService';

function mockFetchOnce(response: Partial<Response> & { jsonBody?: unknown }) {
  const { jsonBody, ...rest } = response;
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue(jsonBody),
    ...rest,
  } as unknown as Response);
}

describe('apiService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('injects the Authorization header when a token is stored', async () => {
    localStorage.setItem('token', 'abc123');
    const fetchMock = mockFetchOnce({ jsonBody: [] });
    vi.stubGlobal('fetch', fetchMock);

    await apiService.getTransactions();

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer abc123');
  });

  it('does not send an Authorization header when there is no token', async () => {
    const fetchMock = mockFetchOnce({ jsonBody: [] });
    vi.stubGlobal('fetch', fetchMock);

    await apiService.getTransactions();

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers.Authorization).toBeUndefined();
  });

  it('stores the token on successful login', async () => {
    const fetchMock = mockFetchOnce({
      jsonBody: { token: 'new-token', user: { id: '1', email: 'a@b.com', role: 'user' } },
    });
    vi.stubGlobal('fetch', fetchMock);

    await apiService.login('a@b.com', 'password123');

    expect(localStorage.getItem('token')).toBe('new-token');
  });

  it('throws a readable Error using the backend error message on a non-2xx response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: vi.fn().mockResolvedValue({ error: 'Invalid username or password.' }),
    } as unknown as Response);
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiService.login('a@b.com', 'wrong')).rejects.toThrow(
      'Invalid username or password.',
    );
  });

  it('clears the token on logout', async () => {
    localStorage.setItem('token', 'abc123');

    await apiService.logout();

    expect(localStorage.getItem('token')).toBeNull();
  });

  it('checkAuthStatus returns null and clears the token when the request fails', async () => {
    localStorage.setItem('token', 'expired-token');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: vi.fn().mockResolvedValue({ error: 'Session expired.' }),
    } as unknown as Response);
    vi.stubGlobal('fetch', fetchMock);

    const result = await apiService.checkAuthStatus();

    expect(result).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });
});
