'use client';

import { Suspense } from 'react';
import { RecipeContent } from './components/RecipeContent';

function RecipePageLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
    </div>
  );
}

export default function RecipePage() {
  return (
    <Suspense fallback={<RecipePageLoading />}>
      <RecipeContent />
    </Suspense>
  );
}
