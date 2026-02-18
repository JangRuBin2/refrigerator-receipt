'use client';

import { useState, useCallback, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { PremiumGate } from '@/components/premium/PremiumGate';
import { PremiumModal } from '@/components/premium/PremiumModal';
import {
  RecipeRoulette,
  RecipeList,
  RecipeDetailModal,
  ExternalSearchSection,
  type RecipeWithAvailability,
} from '@/features/recipes';

function RecipesContent() {
  const params = useParams();
  const locale = String(params.locale ?? 'ko');

  const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithAvailability | null>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [filteredRecipes, setFilteredRecipes] = useState<RecipeWithAvailability[]>([]);

  const handleRecipeClick = useCallback((recipe: RecipeWithAvailability) => {
    setSelectedRecipe(recipe);
    setShowRecipeModal(true);
  }, []);

  const handleRouletteSelect = useCallback((recipe: RecipeWithAvailability) => {
    setSelectedRecipe(recipe);
  }, []);

  const handleRecipesLoaded = useCallback((recipes: RecipeWithAvailability[]) => {
    setFilteredRecipes(recipes);
  }, []);

  return (
    <div className="space-y-4 p-4">
      <RecipeRoulette
        locale={locale}
        filteredRecipes={filteredRecipes}
        onSelectRecipe={handleRouletteSelect}
        onViewRecipe={() => setShowRecipeModal(true)}
      />

      <RecipeList
        locale={locale}
        onRecipeClick={handleRecipeClick}
        onRecipesLoaded={handleRecipesLoaded}
      />

      <ExternalSearchSection />

      <RecipeDetailModal
        locale={locale}
        recipe={selectedRecipe}
        isOpen={showRecipeModal}
        onClose={() => setShowRecipeModal(false)}
      />

      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        feature="external_recipe_search"
      />
    </div>
  );
}

function RecipesLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
    </div>
  );
}

export default function RecipesPage() {
  return (
    <PremiumGate feature="recipe_browsing">
      <div className="min-h-screen">
        <Suspense fallback={<RecipesLoading />}>
          <RecipesContent />
        </Suspense>
      </div>
    </PremiumGate>
  );
}
