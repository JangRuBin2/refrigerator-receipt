'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Refrigerator, Camera, ChefHat, User, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { usePremium } from '@/hooks/usePremium';

interface NavItem {
  href: string;
  icon: typeof Home;
  labelKey: string;
  premiumOnly?: boolean;
}

export function BottomNav({ locale }: { locale: string }) {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const { isPremium } = usePremium();

  const navItems: NavItem[] = [
    { href: `/${locale}`, icon: Home, labelKey: 'home' },
    { href: `/${locale}/fridge`, icon: Refrigerator, labelKey: 'fridge', premiumOnly: true },
    { href: `/${locale}/scan`, icon: Camera, labelKey: 'scan', premiumOnly: true },
    { href: `/${locale}/recipes`, icon: ChefHat, labelKey: 'recipes', premiumOnly: true },
    { href: `/${locale}/settings`, icon: User, labelKey: 'settings' },
  ];

  const isActive = (href: string) => {
    if (href === `/${locale}`) {
      return pathname === `/${locale}` || pathname === `/${locale}/`;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <nav className="mx-auto flex h-14 max-w-lg items-center justify-around rounded-full bg-white/95 shadow-[0_4px_24px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.04] backdrop-blur-xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const showLock = item.premiumOnly && !isPremium;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-1.5 transition-colors',
                active
                  ? 'text-blue-600'
                  : 'text-gray-400'
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 1.8} />
                {showLock && (
                  <Lock className="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 text-gray-300" />
                )}
              </div>
              <span className={cn('text-[10px]', active ? 'font-semibold' : 'font-medium')}>
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
