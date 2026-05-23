'use client';

import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n, { initI18n } from '@/lib/i18n';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initI18n();
  }, []);

  initI18n(); // safe to call multiple times (guarded)

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
