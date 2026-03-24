'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { spring } from '@/lib/animations';

interface TutorialProgressProps {
  progress: number;
  currentStep: number;
  totalSteps: number;
  onExit: () => void;
  exitLabel: string;
}

export function TutorialProgress({
  progress,
  currentStep,
  totalSteps,
  onExit,
  exitLabel,
}: TutorialProgressProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <button
        onClick={onExit}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
        aria-label={exitLabel}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <div className="relative flex-1 h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-green-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={spring.snappy}
        />
      </div>

      <span className="shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400">
        {currentStep}/{totalSteps}
      </span>
    </div>
  );
}
