import { create } from 'zustand';
import type { Ingredient } from '@/types';
import { generateId } from '@/lib/utils';

export type TutorialStepId =
  | 'welcome'
  | 'add-ingredient'
  | 'view-fridge'
  | 'check-expiry'
  | 'scan-receipt'
  | 'view-recipes'
  | 'complete';

export interface TutorialStep {
  id: TutorialStepId;
  order: number;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  { id: 'welcome', order: 0 },
  { id: 'add-ingredient', order: 1 },
  { id: 'view-fridge', order: 2 },
  { id: 'check-expiry', order: 3 },
  { id: 'scan-receipt', order: 4 },
  { id: 'view-recipes', order: 5 },
  { id: 'complete', order: 6 },
];

const TUTORIAL_STORAGE_KEY = 'mealkeeper-tutorial';

interface TutorialStore {
  isActive: boolean;
  currentStepIndex: number;
  steps: TutorialStep[];
  mockIngredients: Ingredient[];

  start: () => void;
  nextStep: () => void;
  prevStep: () => void;
  exit: () => void;
  getCurrentStep: () => TutorialStep;
  getProgress: () => number;

  addMockIngredient: (ingredient: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>) => void;
  clearMockData: () => void;
}

export const useTutorialStore = create<TutorialStore>()((set, get) => ({
  isActive: false,
  currentStepIndex: 0,
  steps: TUTORIAL_STEPS,
  mockIngredients: [],

  start: () => {
    set({
      isActive: true,
      currentStepIndex: 0,
      mockIngredients: [],
    });
    try {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify({ active: true }));
    } catch {
      // localStorage unavailable
    }
  },

  nextStep: () => {
    const { currentStepIndex, steps } = get();
    if (currentStepIndex < steps.length - 1) {
      set({ currentStepIndex: currentStepIndex + 1 });
    }
  },

  prevStep: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex > 0) {
      set({ currentStepIndex: currentStepIndex - 1 });
    }
  },

  exit: () => {
    set({
      isActive: false,
      currentStepIndex: 0,
      mockIngredients: [],
    });
    try {
      localStorage.removeItem(TUTORIAL_STORAGE_KEY);
    } catch {
      // localStorage unavailable
    }
  },

  getCurrentStep: () => {
    const { steps, currentStepIndex } = get();
    return steps[currentStepIndex];
  },

  getProgress: () => {
    const { currentStepIndex, steps } = get();
    return ((currentStepIndex) / (steps.length - 1)) * 100;
  },

  addMockIngredient: (ingredient) => {
    const newIngredient: Ingredient = {
      ...ingredient,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({
      mockIngredients: [...state.mockIngredients, newIngredient],
    }));
  },

  clearMockData: () => {
    set({ mockIngredients: [] });
  },
}));
