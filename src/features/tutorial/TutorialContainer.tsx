'use client';

import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTutorialStore } from '@/store/useTutorialStore';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { TutorialProgress } from './TutorialProgress';
import { ExitConfirmModal } from './ExitConfirmModal';
import { WelcomeStep } from './steps/WelcomeStep';
import { AddIngredientStep } from './steps/AddIngredientStep';
import { ViewFridgeStep } from './steps/ViewFridgeStep';
import { CheckExpiryStep } from './steps/CheckExpiryStep';
import { ScanReceiptStep } from './steps/ScanReceiptStep';
import { ViewRecipesStep } from './steps/ViewRecipesStep';
import { CompleteStep } from './steps/CompleteStep';

export function TutorialContainer() {
  const t = useTranslations('tutorial');
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'ko';

  const {
    currentStepIndex,
    steps,
    nextStep,
    exit,
    getProgress,
    getCurrentStep,
  } = useTutorialStore();

  const [showExitModal, setShowExitModal] = useState(false);

  const currentStep = getCurrentStep();
  const progress = getProgress();
  const totalSteps = steps.length - 1; // exclude 'complete' from count

  const handleExit = useCallback(() => {
    setShowExitModal(true);
  }, []);

  const handleConfirmExit = useCallback(() => {
    exit();
    router.push(`/${locale}`);
  }, [exit, router, locale]);

  const handleCancelExit = useCallback(() => {
    setShowExitModal(false);
  }, []);

  const renderStep = () => {
    switch (currentStep.id) {
      case 'welcome':
        return <WelcomeStep onNext={nextStep} />;
      case 'add-ingredient':
        return <AddIngredientStep onNext={nextStep} />;
      case 'view-fridge':
        return <ViewFridgeStep onNext={nextStep} />;
      case 'check-expiry':
        return <CheckExpiryStep onNext={nextStep} />;
      case 'scan-receipt':
        return <ScanReceiptStep onNext={nextStep} />;
      case 'view-recipes':
        return <ViewRecipesStep onNext={nextStep} />;
      case 'complete':
        return <CompleteStep />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-800">
      {/* Progress bar - hide on welcome and complete */}
      {currentStep.id !== 'welcome' && currentStep.id !== 'complete' && (
        <TutorialProgress
          progress={progress}
          currentStep={currentStepIndex}
          totalSteps={totalSteps}
          onExit={handleExit}
          exitLabel={t('exit.button')}
        />
      )}

      {/* Step content */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <div key={currentStep.id}>
            {renderStep()}
          </div>
        </AnimatePresence>
      </div>

      {/* Exit confirmation modal */}
      <ExitConfirmModal
        isOpen={showExitModal}
        onConfirm={handleConfirmExit}
        onCancel={handleCancelExit}
        title={t('exit.title')}
        description={t('exit.description')}
        confirmLabel={t('exit.confirm')}
        cancelLabel={t('exit.cancel')}
      />
    </div>
  );
}
