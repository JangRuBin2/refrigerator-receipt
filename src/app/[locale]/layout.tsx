import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { BottomNav } from '@/components/layout/BottomNav';
import '../globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#22c55e" />
        <link rel="icon" href="/favicon.ico" />
        <title>Fridge Mate</title>
      </head>
      <body className="bg-gray-50 dark:bg-gray-900">
        <NextIntlClientProvider messages={messages}>
          <div className="mx-auto min-h-screen max-w-lg bg-white shadow-lg dark:bg-gray-800">
            <main className="pb-20">{children}</main>
            <BottomNav locale={locale} />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
