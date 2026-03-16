'use client';

import { useTranslations } from 'next-intl';
import { Globe, Moon, Sun, Trash2 } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/store/useStore';
import { locales, localeNames, type Locale } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { SettingsItem } from './SettingsItem';

interface PreferencesSectionProps {
  locale: string;
  isLanguageModalOpen: boolean;
  onOpenLanguageModal: () => void;
  onCloseLanguageModal: () => void;
  onLanguageChange: (locale: Locale) => void;
}

export function PreferencesSection({
  locale,
  isLanguageModalOpen,
  onOpenLanguageModal,
  onCloseLanguageModal,
  onLanguageChange,
}: PreferencesSectionProps) {
  const t = useTranslations();
  const { settings, updateSettings } = useStore();

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    updateSettings({ theme });
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <SettingsItem icon={Globe} label={t('settings.selectLanguage')} value={localeNames[locale as Locale]} onClick={onOpenLanguageModal} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h3 className="mb-3 text-sm font-medium text-gray-500">{t('settings.theme')}</h3>
          <div className="grid grid-cols-3 gap-2">
            {(['light', 'dark', 'system'] as const).map((theme) => (
              <button
                key={theme}
                onClick={() => handleThemeChange(theme)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors',
                  settings.theme === theme
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                )}
              >
                {theme === 'light' && <Sun className="h-5 w-5" />}
                {theme === 'dark' && <Moon className="h-5 w-5" />}
                {theme === 'system' && <div className="flex"><Sun className="h-4 w-4" /><Moon className="h-4 w-4" /></div>}
                <span className="text-xs">
                  {theme === 'light' && t('settings.lightMode')}
                  {theme === 'dark' && t('settings.darkMode')}
                  {theme === 'system' && t('settings.system')}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trash2 className="h-5 w-5 text-gray-500" />
              <div>
                <span className="font-medium">{t('settings.autoDeleteExpired')}</span>
                <p className="text-xs text-gray-500">{t('settings.autoDeleteExpiredDesc')}</p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ autoDeleteExpired: !settings.autoDeleteExpired })}
              className={cn(
                'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors',
                settings.autoDeleteExpired ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
              )}
            >
              <span className={cn(
                'inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform',
                settings.autoDeleteExpired ? 'translate-x-6' : 'translate-x-1'
              )} />
            </button>
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={isLanguageModalOpen} onClose={onCloseLanguageModal} title={t('settings.selectLanguage')}>
        <div className="space-y-2">
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => onLanguageChange(loc)}
              className={cn(
                'flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors',
                locale === loc ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              )}
            >
              <span>{localeNames[loc]}</span>
              {locale === loc && <span>✓</span>}
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}
