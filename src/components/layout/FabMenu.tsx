'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Refrigerator, Camera, ChefHat, User, Menu, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { spring } from '@/lib/animations';
import { useHaptic } from '@/hooks/useHaptic';

interface MenuItem {
  href: string;
  icon: typeof Home;
  labelKey: string;
}

export function FabMenu({ locale }: { locale: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations('nav');
  const { light } = useHaptic();

  const menuItems: MenuItem[] = [
    { href: `/${locale}`, icon: Home, labelKey: 'home' },
    { href: `/${locale}/fridge`, icon: Refrigerator, labelKey: 'fridge' },
    { href: `/${locale}/scan`, icon: Camera, labelKey: 'scan' },
    { href: `/${locale}/recipes`, icon: ChefHat, labelKey: 'recipes' },
    { href: `/${locale}/settings`, icon: User, labelKey: 'settings' },
  ];

  const isActive = (href: string) => {
    if (href === `/${locale}`) {
      return pathname === `/${locale}` || pathname === `/${locale}/`;
    }
    return pathname.startsWith(href);
  };

  const close = useCallback(() => setIsOpen(false), []);

  // Close on route change
  useEffect(() => {
    close();
  }, [pathname, close]);

  // ESC key support
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  const handleToggle = () => {
    light();
    setIsOpen((prev) => !prev);
  };

  return (
    <>
      {/* Background overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[39] bg-black/30 backdrop-blur-[2px]"
            onClick={close}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Menu items */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed bottom-[5.5rem] right-5 z-40 mb-[max(0rem,env(safe-area-inset-bottom))] flex flex-col-reverse items-end gap-3">
            {menuItems.map((item, i) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  transition={{
                    ...spring.snappy,
                    delay: i * 0.04,
                  }}
                >
                  <Link
                    href={item.href}
                    onClick={() => light()}
                    className={cn(
                      'flex items-center gap-3 rounded-full px-5 py-3 shadow-lg transition-colors',
                      'min-h-[48px]',
                      active
                        ? 'bg-orange-500 text-white shadow-orange-500/25'
                        : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                    )}
                  >
                    <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 1.8} />
                    <span className={cn('text-sm', active ? 'font-semibold' : 'font-medium')}>
                      {t(item.labelKey)}
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* FAB button */}
      <motion.button
        onClick={handleToggle}
        whileTap={{ scale: 0.92 }}
        className={cn(
          'fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg',
          'bg-blue-600 text-white',
          'mb-[max(0rem,env(safe-area-inset-bottom))]'
        )}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
      >
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.15 }}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </motion.div>
      </motion.button>
    </>
  );
}
