'use client';

import { useEffect } from 'react';
import { useTutorialStore } from '@/store/useTutorialStore';
import { TutorialContainer } from '@/features/tutorial/TutorialContainer';

export default function GuidePage() {
  const { isActive, start } = useTutorialStore();

  useEffect(() => {
    if (!isActive) {
      start();
    }
  }, []);

  return <TutorialContainer />;
}
