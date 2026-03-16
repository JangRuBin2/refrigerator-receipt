'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { LogOut, UserX, UserCog } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';
import { clearAllUserData } from '@/lib/auth-cleanup';

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  gender?: string | null;
  birth_date?: string | null;
}

interface ProfileSectionProps {
  locale: string;
  onRequestLogout: () => void;
  onRequestDeleteAccount: () => void;
}

export function ProfileSection({ locale, onRequestLogout, onRequestDeleteAccount }: ProfileSectionProps) {
  const t = useTranslations();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, gender, birth_date')
            .eq('id', authUser.id)
            .single();
          let name = authUser.user_metadata?.full_name || authUser.user_metadata?.name || profile?.name;
          if (!name && authUser.user_metadata?.auth_provider === 'toss') {
            name = t('settings.tossUser');
          }
          setUser({
            id: authUser.id,
            email: authUser.email || '',
            name,
            avatar_url: authUser.user_metadata?.avatar_url,
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
    fetchUser();
  }, [t]);

  const handleGenderChange = async (gender: string | null) => {
    if (!user) return;
    setUser({ ...user, gender });
    const supabase = createClient();
    await supabase.from('profiles').update({ gender }).eq('id', user.id);
  };

  const handleBirthDateChange = async (birth_date: string | null) => {
    if (!user) return;
    setUser({ ...user, birth_date });
    const supabase = createClient();
    await supabase.from('profiles').update({ birth_date }).eq('id', user.id);
  };

  return (
    <>
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
        <>
          <div className="space-y-3">
            <Button variant="outline" className="w-full" onClick={onRequestLogout}>
              <LogOut className="mr-2 h-4 w-4" />{t('settings.logout')}
            </Button>
            <Button variant="danger" className="w-full" onClick={onRequestDeleteAccount}>
              <UserX className="mr-2 h-4 w-4" />{t('settings.deleteAccount')}
            </Button>
          </div>

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
                  onChange={(e) => handleGenderChange(e.target.value || null)}
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
                  onChange={(e) => handleBirthDateChange(e.target.value || null)}
                />
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}

export { type UserProfile };
