import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiService } from '../services/apiService';
import { useAuthStore } from '../store/authStore';
import { labelClass, primaryButtonClass, textInputClass } from '../styles/formStyles';

export default function RegisterPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('auth.register.passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.register.passwordTooShort'));
      return;
    }

    setIsLoading(true);
    try {
      const user = await apiService.register(email, password, i18n.resolvedLanguage);
      setUser(user);
      navigate('/app/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.register.genericError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 md:p-12 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-primary-600 dark:text-primary-400 mb-8">
          {t('auth.register.title')}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className={labelClass}>
              {t('auth.register.email')}
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={textInputClass}
              placeholder={t('auth.register.emailPlaceholder')}
            />
          </div>

          <div>
            <label htmlFor="password" className={labelClass}>
              {t('auth.register.password')}
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={textInputClass}
              placeholder={t('auth.register.passwordPlaceholder')}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className={labelClass}>
              {t('auth.register.confirmPassword')}
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={textInputClass}
              placeholder={t('auth.register.passwordPlaceholder')}
            />
          </div>

          {error && <p className="text-danger-500 text-sm text-center">{error}</p>}

          <div>
            <button type="submit" disabled={isLoading} className={primaryButtonClass}>
              {isLoading ? t('auth.register.submitting') : t('auth.register.submit')}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          {t('auth.register.haveAccount')}{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">
            {t('auth.register.loginLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}
