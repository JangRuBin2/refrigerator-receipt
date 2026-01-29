export interface SubscriptionResponse {
  isPremium: boolean;
  plan: 'free' | 'premium';
  billingCycle?: 'monthly' | 'yearly';
  expiresAt?: string;
  autoRenew?: boolean;
}
