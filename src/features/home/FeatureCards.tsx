'use client';

import { motion } from 'framer-motion';
import { Activity, ChevronRight, Plus, ShoppingCart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { spring } from '@/lib/animations';

interface FeatureCardsProps {
  locale: string;
}

export function FeatureCards({ locale }: FeatureCardsProps) {
  const t = useTranslations();

  const cards = [
    {
      href: `/${locale}/nutrition`,
      icon: Activity,
      iconBg: 'bg-violet-100 dark:bg-violet-900/30',
      iconColor: 'text-violet-600 dark:text-violet-400',
      title: t('nutrition.title'),
      description: t('home.nutritionDescription'),
    },
    {
      href: `/${locale}/shopping`,
      icon: ShoppingCart,
      iconBg: 'bg-teal-100 dark:bg-teal-900/30',
      iconColor: 'text-teal-600 dark:text-teal-400',
      title: t('shopping.title'),
      description: t('home.shoppingDescription'),
    },
    {
      href: `/${locale}/fridge/add`,
      icon: Plus,
      iconBg: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
      title: t('fridge.manualAdd'),
      description: t('fridge.addIngredient'),
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring.gentle, delay: 0.45 }}
      className="space-y-toss-md"
    >
      {cards.map((card) => (
        <Link key={card.href} href={card.href}>
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="toss-card flex items-center gap-toss-md"
          >
            <div className={`rounded-2xl p-3 ${card.iconBg}`}>
              <card.icon className={`h-6 w-6 ${card.iconColor}`} />
            </div>
            <div className="flex-1">
              <h3 className="toss-body1 font-semibold">{card.title}</h3>
              <p className="toss-caption">{card.description}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </motion.div>
        </Link>
      ))}
    </motion.section>
  );
}
