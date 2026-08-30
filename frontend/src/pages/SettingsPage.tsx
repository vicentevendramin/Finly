import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import type { EmploymentStatus, IncomeFrequency } from '../types';
import { labelClass, primaryButtonClass, textInputClass } from '../styles/formStyles';
import Avatar from '../components/Avatar';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useThemeStore } from '../store/themeStore';
import {
  useChangeEmail,
  useChangePassword,
  useDeleteAvatar,
  useProfile,
  useUpdateProfile,
  useUpdateWork,
  useUploadAvatar,
} from '../hooks/useProfile';

type TabId = 'profile' | 'work' | 'preferences' | 'security';
const TABS: TabId[] = ['profile', 'work', 'preferences', 'security'];

const EMPLOYMENT_STATUSES: EmploymentStatus[] = [
  'employed',
  'self_employed',
  'student',
  'unemployed',
  'retired',
  'other',
];
const FREQUENCIES: IncomeFrequency[] = ['monthly', 'biweekly', 'weekly', 'annual'];

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// ─── Feedback line ───────────────────────────────────────────────────────────

const Feedback: React.FC<{ error?: string; ok?: string }> = ({ error, ok }) => {
  if (error) return <p className="text-danger-500 text-sm">{error}</p>;
  if (ok) return <p className="text-success-600 dark:text-success-500 text-sm">{ok}</p>;
  return null;
};

// ─── Profile tab ─────────────────────────────────────────────────────────────

const ProfileTab: React.FC = () => {
  const { t } = useTranslation();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const deleteAvatar = useDeleteAvatar();
  const changeEmail = useChangeEmail();
  const fileInput = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileMsg, setProfileMsg] = useState<{ error?: string; ok?: string }>({});

  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailMsg, setEmailMsg] = useState<{ error?: string; ok?: string }>({});

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName ?? '');
      setPhone(profile.phone ?? '');
    }
  }, [profile]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg({});
    try {
      await updateProfile.mutateAsync({
        displayName: displayName.trim() || null,
        phone: phone.trim() || null,
      });
      setProfileMsg({ ok: t('settings.profile.saved') });
    } catch (err) {
      setProfileMsg({ error: err instanceof Error ? err.message : String(err) });
    }
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setProfileMsg({});
    try {
      await uploadAvatar.mutateAsync(file);
    } catch (err) {
      setProfileMsg({ error: err instanceof Error ? err.message : String(err) });
    }
  };

  const changeEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailMsg({});
    try {
      await changeEmail.mutateAsync({ newEmail: newEmail.trim(), currentPassword: emailPassword });
      setEmailMsg({ ok: t('settings.profile.emailChanged') });
      setNewEmail('');
      setEmailPassword('');
    } catch (err) {
      setEmailMsg({ error: err instanceof Error ? err.message : String(err) });
    }
  };

  return (
    <div className="space-y-8">
      {/* Avatar */}
      <div>
        <span className={`${labelClass} mb-2 block`}>{t('settings.profile.avatar')}</span>
        <div className="flex items-center gap-4">
          <Avatar size={72} />
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={uploadAvatar.isPending}
                className="px-3 py-1.5 text-sm rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                {t('settings.profile.upload')}
              </button>
              {profile?.hasAvatar && (
                <button
                  type="button"
                  onClick={() => deleteAvatar.mutate()}
                  disabled={deleteAvatar.isPending}
                  className="px-3 py-1.5 text-sm rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  {t('settings.profile.remove')}
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('settings.profile.avatarHint')}</p>
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={onPickFile}
          />
        </div>
      </div>

      {/* Display name + phone */}
      <form onSubmit={saveProfile} className="space-y-4 max-w-md">
        <div>
          <label htmlFor="display-name" className={labelClass}>
            {t('settings.profile.displayName')}
          </label>
          <input
            id="display-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t('settings.profile.displayNamePlaceholder')}
            className={textInputClass}
          />
        </div>
        <div>
          <label htmlFor="phone" className={labelClass}>
            {t('settings.profile.phone')}
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t('settings.profile.phonePlaceholder')}
            className={textInputClass}
          />
        </div>
        <Feedback {...profileMsg} />
        <button type="submit" disabled={updateProfile.isPending} className={primaryButtonClass}>
          {updateProfile.isPending ? t('common.saving') : t('settings.profile.save')}
        </button>
      </form>

      {/* Email change */}
      <form onSubmit={changeEmailSubmit} className="space-y-4 max-w-md border-t border-gray-200 dark:border-gray-700 pt-6">
        <h4 className="font-semibold text-gray-800 dark:text-gray-100">
          {t('settings.profile.emailSection')}
        </h4>
        <div>
          <label htmlFor="new-email" className={labelClass}>
            {t('settings.profile.newEmail')}
          </label>
          <input
            id="new-email"
            type="email"
            required
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className={textInputClass}
          />
        </div>
        <div>
          <label htmlFor="email-password" className={labelClass}>
            {t('settings.profile.currentPassword')}
          </label>
          <input
            id="email-password"
            type="password"
            required
            value={emailPassword}
            onChange={(e) => setEmailPassword(e.target.value)}
            className={textInputClass}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t('settings.profile.currentPasswordHint')}
          </p>
        </div>
        <Feedback {...emailMsg} />
        <button type="submit" disabled={changeEmail.isPending} className={primaryButtonClass}>
          {changeEmail.isPending ? t('common.saving') : t('settings.profile.changeEmail')}
        </button>
      </form>
    </div>
  );
};

// ─── Work & Income tab ───────────────────────────────────────────────────────

const WorkTab: React.FC = () => {
  const { t } = useTranslation();
  const { data: profile } = useProfile();
  const updateWork = useUpdateWork();

  const [status, setStatus] = useState<EmploymentStatus | ''>('');
  const [income, setIncome] = useState('');
  const [frequency, setFrequency] = useState<IncomeFrequency>('monthly');
  const [payDay, setPayDay] = useState('');
  const [msg, setMsg] = useState<{ error?: string; ok?: string }>({});

  useEffect(() => {
    if (!profile) return;
    setStatus(profile.employmentStatus ?? '');
    setIncome(profile.incomeAmount != null ? String(profile.incomeAmount) : '');
    setFrequency(profile.incomeFrequency ?? 'monthly');
    setPayDay(profile.payDay != null ? String(profile.payDay) : '');
  }, [profile]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({});
    try {
      await updateWork.mutateAsync({
        employmentStatus: status || null,
        incomeAmount: income.trim() === '' ? null : Number(income),
        incomeFrequency: income.trim() === '' ? null : frequency,
        payDay: payDay.trim() === '' ? null : Number(payDay),
      });
      setMsg({ ok: t('settings.work.saved') });
    } catch (err) {
      setMsg({ error: err instanceof Error ? err.message : String(err) });
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 max-w-md">
      <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.work.intro')}</p>

      <div>
        <label htmlFor="employment-status" className={labelClass}>
          {t('settings.work.employmentStatus')}
        </label>
        <select
          id="employment-status"
          value={status}
          onChange={(e) => setStatus(e.target.value as EmploymentStatus | '')}
          className={textInputClass}
        >
          <option value="">—</option>
          {EMPLOYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`settings.work.status.${s}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor="income" className={labelClass}>
            {t('settings.work.income')}
          </label>
          <input
            id="income"
            type="number"
            min="0"
            step="0.01"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            className={textInputClass}
          />
        </div>
        <div className="flex-1">
          <label htmlFor="income-frequency" className={labelClass}>
            {t('settings.work.incomeFrequency')}
          </label>
          <select
            id="income-frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as IncomeFrequency)}
            className={textInputClass}
          >
            {FREQUENCIES.map((f) => (
              <option key={f} value={f}>
                {t(`settings.work.frequency.${f}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {profile?.monthlyIncome != null && frequency !== 'monthly' && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t('settings.work.monthlyEquivalent', { value: formatBRL(profile.monthlyIncome) })}
        </p>
      )}

      <div>
        <label htmlFor="pay-day" className={labelClass}>
          {t('settings.work.payDay')}
        </label>
        <input
          id="pay-day"
          type="number"
          min="1"
          max="31"
          value={payDay}
          onChange={(e) => setPayDay(e.target.value)}
          className={textInputClass}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('settings.work.payDayHint')}</p>
      </div>

      <Feedback {...msg} />
      <button type="submit" disabled={updateWork.isPending} className={primaryButtonClass}>
        {updateWork.isPending ? t('common.saving') : t('settings.work.save')}
      </button>
    </form>
  );
};

// ─── Preferences tab ─────────────────────────────────────────────────────────

const PreferencesTab: React.FC = () => {
  const { t } = useTranslation();
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  return (
    <div className="space-y-6 max-w-md">
      <div>
        <span className={`${labelClass} mb-2 block`}>{t('settings.preferences.language')}</span>
        <LanguageSwitcher />
      </div>
      <div>
        <span className={`${labelClass} mb-2 block`}>{t('settings.preferences.theme')}</span>
        <div className="flex gap-2">
          {(['light', 'dark'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                if (theme !== option) toggleTheme();
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                theme === option
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
              }`}
            >
              {t(`settings.preferences.theme${option === 'light' ? 'Light' : 'Dark'}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Security tab ────────────────────────────────────────────────────────────

const SecurityTab: React.FC = () => {
  const { t } = useTranslation();
  const changePassword = useChangePassword();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState<{ error?: string; ok?: string }>({});

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({});
    if (next.length < 6) {
      setMsg({ error: t('settings.security.tooShort') });
      return;
    }
    if (next !== confirm) {
      setMsg({ error: t('settings.security.mismatch') });
      return;
    }
    try {
      await changePassword.mutateAsync({ currentPassword: current, newPassword: next });
      setMsg({ ok: t('settings.security.changed') });
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      setMsg({ error: err instanceof Error ? err.message : String(err) });
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 max-w-md">
      <div>
        <label htmlFor="current-password" className={labelClass}>
          {t('settings.security.currentPassword')}
        </label>
        <input
          id="current-password"
          type="password"
          required
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className={textInputClass}
        />
      </div>
      <div>
        <label htmlFor="new-password" className={labelClass}>
          {t('settings.security.newPassword')}
        </label>
        <input
          id="new-password"
          type="password"
          required
          value={next}
          onChange={(e) => setNext(e.target.value)}
          className={textInputClass}
        />
      </div>
      <div>
        <label htmlFor="confirm-password" className={labelClass}>
          {t('settings.security.confirmPassword')}
        </label>
        <input
          id="confirm-password"
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={textInputClass}
        />
      </div>
      <Feedback {...msg} />
      <button type="submit" disabled={changePassword.isPending} className={primaryButtonClass}>
        {changePassword.isPending ? t('common.saving') : t('settings.security.save')}
      </button>
    </form>
  );
};

// ─── Page shell ──────────────────────────────────────────────────────────────

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TabId | null;
  const activeTab: TabId = tabParam && TABS.includes(tabParam) ? tabParam : 'profile';

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl">
      <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6">
        {t('settings.title')}
      </h3>

      <div className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-700 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setSearchParams(tab === 'profile' ? {} : { tab })}
            className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 ${
              activeTab === tab
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {t(`settings.tabs.${tab}`)}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && <ProfileTab />}
      {activeTab === 'work' && <WorkTab />}
      {activeTab === 'preferences' && <PreferencesTab />}
      {activeTab === 'security' && <SecurityTab />}
    </div>
  );
};

export default SettingsPage;
