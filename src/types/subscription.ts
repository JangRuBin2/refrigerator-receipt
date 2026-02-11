export interface SubscriptionResponse {
  isPremium: boolean;
  plan: 'free' | 'trial' | 'premium';
  billingCycle?: 'monthly' | 'yearly';
  expiresAt?: string;
  autoRenew?: boolean;
  isTrial?: boolean;
  isTrialActive?: boolean;
  trialDaysRemaining?: number;
}
