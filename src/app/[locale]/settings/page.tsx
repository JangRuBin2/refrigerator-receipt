'use client';

import { useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { Crown, ChevronRight, Heart } from 'lucide-react';
import { useDebugStore } from '@/store/useDebugStore';

import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { BannerAd } from '@/components/ads/BannerAd';
import { usePremium } from '@/hooks/usePremium';
import { createClient } from '@/lib/supabase/client';
import { clearAllUserData } from '@/lib/auth-cleanup';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';
import { ProfileSection } from '@/features/settings/ProfileSection';
import { PreferencesSection } from '@/features/settings/PreferencesSection';
import { SettingsItem } from '@/features/settings/SettingsItem';
import { DeleteAccountModal } from '@/features/settings/DeleteAccountModal';
import { PremiumStatusSheet } from '@/features/settings/PremiumStatusSheet';

type ActiveModal = 'none' | 'language' | 'logout' | 'deleteAccount' | 'premium';

export default function SettingsPage() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const { isPremium, isTrialActive, trialDaysRemaining, subscription } = usePremium();
  const [activeModal, setActiveModal] = useState<ActiveModal>('none');
  const { isEnabled: debugEnabled, enable: enableDebug, disable: disableDebug } = useDebugStore();
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleVersionTap = useCallback(() => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0; }, 2000);

    if (tapCountRef.current >= 7) {
      tapCountRef.current = 0;
      if (debugEnabled) {
        disableDebug();
      } else {
        enableDebug();
      }
    }
  }, [debugEnabled, enableDebug, disableDebug]);

  const handleLanguageChange = (newLocale: Locale) => {
    setActiveModal('none');
    router.push(`/${newLocale}/settings`);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearAllUserData();
    setActiveModal('none');
    window.location.href = `/${locale}/login`;
  };

  return (
    <div className="min-h-screen">
      <div className="space-y-4 p-4 pb-8">
        {/* Account */}
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t('settings.sectionAccount')}</p>
        <ProfileSection
          locale={locale}
          onRequestLogout={() => setActiveModal('logout')}
          onRequestDeleteAccount={() => setActiveModal('deleteAccount')}
        />

        {/* Preferences */}
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 pt-2">{t('settings.sectionPreferences')}</p>
        <PreferencesSection
          locale={locale}
          isLanguageModalOpen={activeModal === 'language'}
          onOpenLanguageModal={() => setActiveModal('language')}
          onCloseLanguageModal={() => setActiveModal('none')}
          onLanguageChange={handleLanguageChange}
        />

        {/* Subscription */}
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 pt-2">{t('settings.sectionSubscription')}</p>
        <Card>
          <CardContent className="p-4">
            <button
              onClick={() => isPremium ? setActiveModal('premium') : router.push(`/${locale}/pricing`)}
              className="flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div className="flex items-center gap-3">
                <Crown className={cn('h-5 w-5', isPremium ? 'text-amber-500' : 'text-gray-400')} />
                <div>
                  {isPremium ? (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{t('pricing.premiumPlan')}</span>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{t('pricing.premiumPlan')}</span>
                    </div>
                  ) : isTrialActive ? (
                    <div>
                      <span className="font-medium">{t('pricing.trialActive')}</span>
                      <p className="text-sm text-primary-600 dark:text-primary-400">{t('pricing.trialDaysLeft', { days: trialDaysRemaining })}</p>
                    </div>
                  ) : (
                    <div>
                      <span className="font-medium">{t('settings.freePlan')}</span>
                      <p className="text-sm text-gray-500">{t('settings.upgradePremium')}</p>
                    </div>
                  )}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <SettingsItem icon={Heart} label={t('favorites.title')} onClick={() => router.push(`/${locale}/favorites`)} />
          </CardContent>
        </Card>

        <BannerAd className="my-2" />

        {/* App Info */}
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 pt-2">{t('settings.sectionAppInfo')}</p>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <button
                onClick={handleVersionTap}
                className="flex w-full justify-between text-left"
              >
                <span>{t('settings.version')}</span>
                <span>{debugEnabled ? '1.0.0 (Debug)' : '1.0.0'}</span>
              </button>
              {[
                [t('settings.businessName'), '인프리'],
                [t('settings.representative'), '장루빈'],
                [t('settings.businessNumber'), '790-39-01572'],
                [t('settings.contact'), 'wkdfnqls2465@gmail.com'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span>{label}</span><span>{value}</span>
                </div>
              ))}
              <div className="flex justify-between">
                <span className="shrink-0">{t('settings.address')}</span>
                <span className="text-right">대전광역시 유성구 대정로28번안길 80</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modals */}
        <Modal isOpen={activeModal === 'logout'} onClose={() => setActiveModal('none')} title={t('settings.logout')}>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">{t('settings.logoutConfirm')}</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setActiveModal('none')} className="flex-1">{t('common.cancel')}</Button>
              <Button onClick={handleLogout} className="flex-1">{t('settings.logout')}</Button>
            </div>
          </div>
        </Modal>

        <DeleteAccountModal isOpen={activeModal === 'deleteAccount'} onClose={() => setActiveModal('none')} locale={locale} />
        <PremiumStatusSheet isOpen={activeModal === 'premium'} onClose={() => setActiveModal('none')} locale={locale} subscription={subscription} />
      </div>
    </div>
  );
}
