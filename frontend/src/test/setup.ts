import '@testing-library/jest-dom/vitest';
import i18n from '../i18n';

// Force a deterministic language regardless of the test environment's
// detected locale (jsdom's navigator.language can vary by machine).
void i18n.changeLanguage('pt-BR');
