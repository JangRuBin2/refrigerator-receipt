'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Refrigerator, Camera, ChefHat, Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  icon: typeof Home;
  labelKey: string;
}

export function BottomNav({ locale }: { locale: string }) {
  const pathname = usePathname();
  const t = useTranslations('nav');

  const navItems: NavItem[] = [
    { href: `/${locale}`, icon: Home, labelKey: 'home' },
    { href: `/${locale}/fridge`, icon: Refrigerator, labelKey: 'fridge' },
    { href: `/${locale}/scan`, icon: Camera, labelKey: 'scan' },
    { href: `/${locale}/recipes`, icon: ChefHat, labelKey: 'recipes' },
    { href: `/${locale}/settings`, icon: Settings, labelKey: 'settings' },
  ];

  const isActive = (href: string) => {
    if (href === `/${locale}`) {
      return pathname === `/${locale}` || pathname === `/${locale}/`;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/80 backdrop-blur-lg safe-bottom dark:border-gray-700 dark:bg-gray-900/80">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 transition-colors',
                active
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'animate-bounce-subtle')} />
              <span className="text-xs font-medium">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
