/**
 * Payment and Subscription Interfaces
 * 
 * Handles all monetization and paywalling logic
 */

import { UserTier } from './UserInterfaces';

export interface PaymentPlan {
    id: string;
    name: string;
    price: number;
    currency: string;
    interval: 'monthly' | 'yearly';
    features: string[];
    tier: UserTier;
    trialDays?: number;
    discountPercentage?: number;
}

export interface PaymentIntent {
    id: string;
    userId: string;
    planId: string;
    amount: number;
    currency: string;
    status: 'pending' | 'processing' | 'succeeded' | 'failed';
    clientSecret?: string;
}

export interface PaymentMethod {
    id: string;
    type: 'card' | 'paypal' | 'bank';
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
    isDefault: boolean;
}

export interface Invoice {
    id: string;
    userId: string;
    subscriptionId?: string;
    amount: number;
    currency: string;
    status: 'draft' | 'open' | 'paid' | 'void' | 'pending';
    dueDate: Date;
    paidDate?: Date;
    description?: string;
    items?: InvoiceItem[];
}

export interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export interface SubscriptionStatus {
    status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
    currentPlan: string;
    renewalDate: Date;
    cancelAtPeriodEnd: boolean;
    trialEnd?: Date;
}

export interface PaywallConfig {
    enabled: boolean;
    freeExerciseLimit: number;
    trialPeriodDays: number;
    premiumFeatures: string[];
    paymentPlans: PaymentPlan[];
}

export interface PaymentWebhook {
    id: string;
    type: string;
    data: Record<string, any>;
    processed: boolean;
    createdAt: Date;
}