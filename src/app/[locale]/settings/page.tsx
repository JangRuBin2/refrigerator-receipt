'use client';

import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { User, Globe, Bell, Palette, Database, LogOut, UserX, ChevronRight, Moon, Sun, Crown, Check, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useStore } from '@/store/useStore';
import { usePremium, PREMIUM_FEATURES, type PremiumFeature } from '@/hooks/usePremium';
import { featureIcons, featureKeys } from '@/components/premium/PremiumModal';
import { locales, localeNames, type Locale } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { createClient } from '@/lib/supabase/client';
import { deleteAccount as deleteAccountApi } from '@/lib/api/auth';
import { clearAllUserData } from '@/lib/auth-cleanup';

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

export default function SettingsPage() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const { settings, updateSettings, clearIngredients } = useStore();
  const { isPremium, isTrialActive, trialDaysRemaining, subscription } = usePremium();
  const [showPremiumSheet, setShowPremiumSheet] = useState(false);

  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // Try to get name from user_metadata first
          let name = user.user_metadata?.full_name || user.user_metadata?.name;

          // If no name in metadata, try profiles table
          if (!name) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('name')
              .eq('id', user.id)
              .single();
            name = profile?.name;
          }

          // Fallback for Toss users
          if (!name && user.user_metadata?.auth_provider === 'toss') {
            name = t('settings.tossUser');
          }

          setUser({
            id: user.id,
            email: user.email || '',
            name,
            avatar_url: user.user_metadata?.avatar_url,
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
    setShowLanguageModal(false);
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

  const handleDeleteAll = () => {
    clearIngredients();
    setShowDeleteModal(false);
  };

  const handleLogin = () => {
    router.push(`/${locale}/login`);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearAllUserData();
    setUser(null);
    setShowLogoutModal(false);
    window.location.href = `/${locale}/login`;
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    setDeleteAccountError(null);
    try {
      await deleteAccountApi();
      const supabase = createClient();
      await supabase.auth.signOut();
      clearAllUserData();
      setUser(null);
      setShowDeleteAccountModal(false);
      window.location.href = `/${locale}/login`;
    } catch (err) {
      setIsDeletingAccount(false);
      setDeleteAccountError(
        err instanceof Error ? err.message : String(err)
      );
    }
  };

  const SettingsItem = ({
    icon: Icon,
    label,
    value,
    onClick,
    danger,
    disabled,
    badge,
  }: {
    icon: typeof User;
    label: string;
    value?: string;
    onClick?: () => void;
    danger?: boolean;
    disabled?: boolean;
    badge?: string;
  }) => (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors',
        danger
          ? 'hover:bg-red-50 dark:hover:bg-red-900/20'
          : 'hover:bg-gray-50 dark:hover:bg-gray-700',
        disabled && 'opacity-60 cursor-not-allowed hover:bg-transparent dark:hover:bg-transparent'
      )}
    >
      <div className="flex items-center gap-3">
        <Icon
          className={cn(
            'h-5 w-5',
            danger ? 'text-red-500' : 'text-gray-500'
          )}
        />
        <span className={cn(danger && 'text-red-600', disabled && 'text-gray-400')}>{label}</span>
        {badge && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-700">
            {badge}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-sm text-gray-500">{value}</span>}
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </div>
    </button>
  );

  return (
    <div className="min-h-screen">


      <div className="space-y-4 p-4 pb-8">
        {/* Section: Account */}
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {t('settings.sectionAccount')}
        </p>

        {/* Profile */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-2xl dark:bg-primary-900 overflow-hidden">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  '👤'
                )}
              </div>
              <div>
                <p className="font-medium">{user?.name || t('settings.guestUser')}</p>
                <p className="text-sm text-gray-500">{user?.email || 'guest@example.com'}</p>
              </div>
            </div>
            {!user && !isLoading && (
              <Button onClick={handleLogin} className="mt-4 w-full">
                {t('auth.login')}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Logout & Delete Account */}
        {user && (
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowLogoutModal(true)}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t('settings.logout')}
            </Button>
            <Button
              variant="danger"
              className="w-full"
              onClick={() => setShowDeleteAccountModal(true)}
            >
              <UserX className="mr-2 h-4 w-4" />
              {t('settings.deleteAccount')}
            </Button>
          </div>
        )}

        {/* Section: Preferences */}
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 pt-2">
          {t('settings.sectionPreferences')}
        </p>

        {/* Language Settings */}
        <Card>
          <CardContent className="p-4">
            <SettingsItem
              icon={Globe}
              label={t('settings.selectLanguage')}
              value={localeNames[locale as Locale]}
              onClick={() => setShowLanguageModal(true)}
            />
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card>
          <CardContent className="p-4">
            <h3 className="mb-3 text-sm font-medium text-gray-500">
              {t('settings.theme')}
            </h3>
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
                  {theme === 'system' && (
                    <div className="flex">
                      <Sun className="h-4 w-4" />
                      <Moon className="h-4 w-4" />
                    </div>
                  )}
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

        {/* Auto Delete Expired */}
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
                  'relative h-6 w-11 rounded-full transition-colors',
                  settings.autoDeleteExpired
                    ? 'bg-primary-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                    settings.autoDeleteExpired ? 'left-[22px]' : 'left-0.5'
                  )}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Section: Subscription */}
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 pt-2">
          {t('settings.sectionSubscription')}
        </p>

        <Card>
          <CardContent className="p-4">
            <button
              onClick={() => {
                if (isPremium) {
                  setShowPremiumSheet(true);
                } else {
                  router.push(`/${locale}/pricing`);
                }
              }}
              className="flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div className="flex items-center gap-3">
                <Crown className={cn(
                  'h-5 w-5',
                  isPremium ? 'text-amber-500' : 'text-gray-400'
                )} />
                <div>
                  {isPremium ? (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{t('pricing.premiumPlan')}</span>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        {t('pricing.premiumPlan')}
                      </span>
                    </div>
                  ) : isTrialActive ? (
                    <div>
                      <span className="font-medium">{t('pricing.trialActive')}</span>
                      <p className="text-sm text-primary-600 dark:text-primary-400">
                        {t('pricing.trialDaysLeft', { days: trialDaysRemaining })}
                      </p>
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

        {/* Data Management */}
        <Card>
          <CardContent className="p-4">
            <SettingsItem
              icon={Database}
              label={t('settings.deleteAll')}
              onClick={() => setShowDeleteModal(true)}
              danger
            />
          </CardContent>
        </Card>

        {/* Section: App Info */}
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 pt-2">
          {t('settings.sectionAppInfo')}
        </p>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>{t('settings.version')}</span>
                <span>1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span>{t('settings.businessName')}</span>
                <span>인프리</span>
              </div>
              <div className="flex justify-between">
                <span>{t('settings.representative')}</span>
                <span>장루빈</span>
              </div>
              <div className="flex justify-between">
                <span>{t('settings.businessNumber')}</span>
                <span>790-39-01572</span>
              </div>
              <div className="flex justify-between">
                <span>{t('settings.contact')}</span>
                <span>wkdfnqls2465@gmail.com</span>
              </div>
              <div className="flex justify-between">
                <span className="shrink-0">{t('settings.address')}</span>
                <span className="text-right">대전광역시 유성구 대정로28번안길 80</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language Modal */}
        <Modal
          isOpen={showLanguageModal}
          onClose={() => setShowLanguageModal(false)}
          title={t('settings.selectLanguage')}
        >
          <div className="space-y-2">
            {locales.map((loc) => (
              <button
                key={loc}
                onClick={() => handleLanguageChange(loc)}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors',
                  locale === loc
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                )}
              >
                <span>{localeNames[loc]}</span>
                {locale === loc && <span>✓</span>}
              </button>
            ))}
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title={t('settings.deleteAll')}
        >
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              {t('settings.deleteWarning')}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button variant="danger" onClick={handleDeleteAll} className="flex-1">
                {t('common.delete')}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Logout Confirmation Modal */}
        <Modal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          title={t('settings.logout')}
        >
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              {t('settings.logoutConfirm')}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button onClick={handleLogout} className="flex-1">
                {t('settings.logout')}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Delete Account Confirmation Modal */}
        <Modal
          isOpen={showDeleteAccountModal}
          onClose={() => {
            if (!isDeletingAccount) {
              setShowDeleteAccountModal(false);
              setDeleteAccountError(null);
            }
          }}
          title={t('settings.deleteAccount')}
        >
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              {t('settings.deleteAccountWarning')}
            </p>
            <p className="font-medium text-red-600">
              {t('settings.deleteAccountConfirm')}
            </p>
            {deleteAccountError && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                {t('settings.deleteAccountError')}: {deleteAccountError}
              </div>
            )}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteAccountModal(false);
                  setDeleteAccountError(null);
                }}
                className="flex-1"
                disabled={isDeletingAccount}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteAccount}
                className="flex-1"
                disabled={isDeletingAccount}
              >
                {isDeletingAccount ? t('common.loading') : t('settings.deleteAccount')}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Premium Services BottomSheet */}
        <BottomSheet
          isOpen={showPremiumSheet}
          onClose={() => setShowPremiumSheet(false)}
          title={t('settings.premiumServices')}
          snapPoints={[60]}
        >
          <div className="space-y-5">
            {/* Subscription Status */}
            <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-900/20">
              <h3 className="mb-2 text-sm font-medium text-amber-700 dark:text-amber-400">
                {t('settings.subscriptionStatus')}
              </h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('settings.planName')}</span>
                  <span className="font-medium text-amber-700 dark:text-amber-400">
                    {t('pricing.premiumPlan')}
                    {subscription?.billingCycle === 'yearly'
                      ? ` (${t('settings.billingYearly')})`
                      : subscription?.billingCycle === 'monthly'
                        ? ` (${t('settings.billingMonthly')})`
                        : ''}
                  </span>
                </div>
                {subscription?.expiresAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t('settings.expiresAt')}</span>
                    <span className="font-medium">
                      {new Date(subscription.expiresAt).toLocaleDateString(locale)}
                    </span>
                  </div>
                )}
                <div className="mt-2 rounded bg-amber-100/60 px-2 py-1.5 text-xs text-amber-700 dark:bg-amber-800/30 dark:text-amber-400">
                  {t('settings.manualRenewNotice')}
                </div>
              </div>
            </div>

            {/* Premium Features List */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-gray-500">
                {t('settings.premiumFeatures')}
              </h3>
              <div className="space-y-2">
                {(Object.entries(PREMIUM_FEATURES) as [PremiumFeature, boolean][]).map(([feature, isPremiumFeature]) => (
                  <div
                    key={feature}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/40 [&>svg]:h-4 [&>svg]:w-4">
                        {featureIcons[feature]}
                      </div>
                      <span className="text-sm font-medium">
                        {t(`pricing.feature.${featureKeys[feature]}`)}
                      </span>
                    </div>
                    {isPremiumFeature && (
                      <Check className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Manage Plan Button */}
            <Button
              onClick={() => {
                setShowPremiumSheet(false);
                router.push(`/${locale}/pricing`);
              }}
              variant="outline"
              className="w-full"
            >
              {t('settings.managePlan')}
            </Button>
          </div>
        </BottomSheet>
      </div>
    </div>
  );
}
