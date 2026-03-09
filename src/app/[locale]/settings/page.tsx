'use client';

import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { User, Globe, Database, LogOut, UserX, ChevronRight, Moon, Sun, Crown, Trash2, Heart, UserCog } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/store/useStore';
import { usePremium } from '@/hooks/usePremium';
import { locales, localeNames, type Locale } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { createClient } from '@/lib/supabase/client';
import { BannerAd } from '@/components/ads/BannerAd';
import { clearAllUserData } from '@/lib/auth-cleanup';
import { SettingsItem } from '@/features/settings/SettingsItem';
import { DeleteAccountModal } from '@/features/settings/DeleteAccountModal';
import { PremiumStatusSheet } from '@/features/settings/PremiumStatusSheet';

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  gender?: string | null;
  birth_date?: string | null;
}

type ActiveModal = 'none' | 'language' | 'delete' | 'logout' | 'deleteAccount' | 'premium';

export default function SettingsPage() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const { settings, updateSettings, clearIngredients } = useStore();
  const { isPremium, isTrialActive, trialDaysRemaining, subscription } = usePremium();
  const [activeModal, setActiveModal] = useState<ActiveModal>('none');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, gender, birth_date')
            .eq('id', user.id)
            .single();
          let name = user.user_metadata?.full_name || user.user_metadata?.name || profile?.name;
          if (!name && user.user_metadata?.auth_provider === 'toss') {
            name = t('settings.tossUser');
          }
          setUser({
            id: user.id,
            email: user.email || '',
            name,
            avatar_url: user.user_metadata?.avatar_url,
            gender: profile?.gender || null,
            birth_date: profile?.birth_date || null,
          });
        }
      } catch {
        // Failed to check user
      } finally {
        setIsLoading(false);
      }
    };
    checkUser();
  }, [t]);

  const handleLanguageChange = (newLocale: Locale) => {
    updateSettings({ locale: newLocale });
    setActiveModal('none');
    router.push(`/${newLocale}/settings`);
  };

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

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearAllUserData();
    setUser(null);
    setActiveModal('none');
    window.location.href = `/${locale}/login`;
  };

  return (
    <div className="min-h-screen">
      <div className="space-y-4 p-4 pb-8">
        {/* Account */}
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t('settings.sectionAccount')}</p>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-2xl dark:bg-primary-900 overflow-hidden">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                ) : '👤'}
              </div>
              <div>
                <p className="font-medium">{user?.name || t('settings.guestUser')}</p>
                <p className="text-sm text-gray-500">{user?.email || 'guest@example.com'}</p>
              </div>
            </div>
            {!user && !isLoading && (
              <Button onClick={() => router.push(`/${locale}/login`)} className="mt-4 w-full">{t('auth.login')}</Button>
            )}
          </CardContent>
        </Card>

        {user && (
          <div className="space-y-3">
            <Button variant="outline" className="w-full" onClick={() => setActiveModal('logout')}>
              <LogOut className="mr-2 h-4 w-4" />{t('settings.logout')}
            </Button>
            <Button variant="danger" className="w-full" onClick={() => setActiveModal('deleteAccount')}>
              <UserX className="mr-2 h-4 w-4" />{t('settings.deleteAccount')}
            </Button>
          </div>
        )}

        {/* Preferences */}
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 pt-2">{t('settings.sectionPreferences')}</p>

        <Card>
          <CardContent className="p-4">
            <SettingsItem icon={Globe} label={t('settings.selectLanguage')} value={localeNames[locale as Locale]} onClick={() => setActiveModal('language')} />
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

        {/* Personal Info for Nutrition Analysis */}
        {user && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <UserCog className="h-5 w-5 text-gray-500" />
                <span className="font-medium">{t('settings.personalInfo')}</span>
              </div>
              <p className="text-xs text-gray-500">{t('settings.personalInfoDesc')}</p>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label={t('settings.gender')}
                  value={user.gender || ''}
                  onChange={async (e) => {
                    const gender = e.target.value || null;
                    setUser({ ...user, gender });
                    const supabase = createClient();
                    await supabase.from('profiles').update({ gender }).eq('id', user.id);
                  }}
                  options={[
                    { value: '', label: t('settings.notSet') },
                    { value: 'male', label: t('settings.male') },
                    { value: 'female', label: t('settings.female') },
                  ]}
                />
                <Input
                  label={t('settings.birthDate')}
                  type="date"
                  value={user.birth_date || ''}
                  onChange={async (e) => {
                    const birth_date = e.target.value || null;
                    setUser({ ...user, birth_date });
                    const supabase = createClient();
                    await supabase.from('profiles').update({ birth_date }).eq('id', user.id);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}

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

        <Card>
          <CardContent className="p-4">
            <SettingsItem icon={Database} label={t('settings.deleteAll')} onClick={() => setActiveModal('delete')} danger />
          </CardContent>
        </Card>

        <BannerAd className="my-2" />

        {/* App Info */}
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 pt-2">{t('settings.sectionAppInfo')}</p>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              {[
                [t('settings.version'), '1.0.0'],
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
        <Modal isOpen={activeModal === 'language'} onClose={() => setActiveModal('none')} title={t('settings.selectLanguage')}>
          <div className="space-y-2">
            {locales.map((loc) => (
              <button
                key={loc}
                onClick={() => handleLanguageChange(loc)}
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

        <Modal isOpen={activeModal === 'delete'} onClose={() => setActiveModal('none')} title={t('settings.deleteAll')}>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">{t('settings.deleteWarning')}</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setActiveModal('none')} className="flex-1">{t('common.cancel')}</Button>
              <Button variant="danger" onClick={() => { clearIngredients(); setActiveModal('none'); }} className="flex-1">{t('common.delete')}</Button>
            </div>
          </div>
        </Modal>

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
