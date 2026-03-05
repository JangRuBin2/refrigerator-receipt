'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { deleteAccount as deleteAccountApi } from '@/lib/api/auth';
import { createClient } from '@/lib/supabase/client';
import { clearAllUserData } from '@/lib/auth-cleanup';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
}

export function DeleteAccountModal({ isOpen, onClose, locale }: DeleteAccountModalProps) {
  const t = useTranslations();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await deleteAccountApi();
      const supabase = createClient();
      await supabase.auth.signOut();
      clearAllUserData();
      window.location.href = `/${locale}/login`;
    } catch (err) {
      setIsDeleting(false);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      onClose();
      setError(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('settings.deleteAccount')}>
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400">{t('settings.deleteAccountWarning')}</p>
        <p className="font-medium text-red-600">{t('settings.deleteAccountConfirm')}</p>
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {t('settings.deleteAccountError')}: {error}
          </div>
        )}
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleClose} className="flex-1" disabled={isDeleting}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" onClick={handleDelete} className="flex-1" disabled={isDeleting}>
            {isDeleting ? t('common.loading') : t('settings.deleteAccount')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
