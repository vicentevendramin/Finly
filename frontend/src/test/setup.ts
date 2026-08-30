import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import i18n from '../i18n';

// jsdom doesn't implement matchMedia; themeStore reads it at module load.
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// URL.createObjectURL is used by the avatar hook.
if (!URL.createObjectURL) {
  URL.createObjectURL = vi.fn(() => 'blob:mock');
}

// Force a deterministic language regardless of the test environment's
// detected locale (jsdom's navigator.language can vary by machine).
void i18n.changeLanguage('pt-BR');
