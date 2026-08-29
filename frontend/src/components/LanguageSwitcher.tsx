import React from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../i18n';

const LANGUAGE_LABELS: Record<(typeof SUPPORTED_LANGUAGES)[number], string> = {
  'pt-BR': 'PT',
  'en-US': 'EN',
};

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage ?? i18n.language;

  return (
    <div className="flex justify-center gap-1 text-xs font-medium">
      {SUPPORTED_LANGUAGES.map((lng) => (
        <button
          key={lng}
          onClick={() => i18n.changeLanguage(lng)}
          className={`px-2 py-1 rounded ${
            current === lng
              ? 'bg-blue-600 text-white'
              : 'text-gray-500 hover:bg-gray-200'
          }`}
        >
          {LANGUAGE_LABELS[lng]}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
