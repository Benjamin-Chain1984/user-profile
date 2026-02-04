/**
 * Subscription & Billing Types
 * For NDIS Low Cost Assistive Technology individual subscriptions
 */

export type SubscriptionStatus = 'trial' | 'active' | 'grace_period' | 'restricted' | 'suspended';
export type BillingCycle = 'monthly' | 'quarterly' | 'annual';
export type InvoiceStatus = 'paid' | 'due' | 'overdue';

export interface Subscription {
  id: string;
  clientId: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  subscriptionType: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  gracePeriodEndsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  subscriptionId: string;
  clientId: string;
  invoiceNumber: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  amountCents: number;
  gstCents: number;
  totalCents: number;
  status: InvoiceStatus;
  billingEntity: string;
  dueDate: string;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Pricing constants (in cents)
export const BILLING_PRICES = {
  monthly: { amount: 3182, gst: 318, total: 3500 },    // $35.00 inc GST
  quarterly: { amount: 9091, gst: 909, total: 10000 }, // $100.00 inc GST
  annual: { amount: 31818, gst: 3182, total: 35000 },  // $350.00 inc GST
} as const;

// Access levels by status
export const ACCESS_LEVELS: Record<SubscriptionStatus, 'full' | 'readonly' | 'none'> = {
  trial: 'full',
  active: 'full',
  grace_period: 'full',
  restricted: 'readonly',
  suspended: 'none',
};
