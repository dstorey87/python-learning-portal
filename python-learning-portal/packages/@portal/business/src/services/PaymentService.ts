/**
 * Payment Service
 * 
 * Handles all subscription and payment logic.
 * Want to add new payment plans? Only modify this service.
 */

import { PaymentPlan, PaymentMethod, Invoice, SubscriptionStatus } from '../interfaces/PaymentInterfaces';
import { UserTier } from '../interfaces/UserInterfaces';

export class PaymentService {

    /**
     * Get available payment plans
     */
    getAvailablePlans(): PaymentPlan[] {
        return [
            {
                id: 'trial',
                name: 'Free Trial',
                price: 0,
                currency: 'USD',
                interval: 'monthly',
                features: [
                    'Access to all exercises',
                    'AI hints included',
                    'Code execution (50/hour)',
                    'Trial for 14 days'
                ],
                tier: 'trial',
                trialDays: 14
            },
            {
                id: 'premium_monthly',
                name: 'Premium Monthly',
                price: 9.99,
                currency: 'USD',
                interval: 'monthly',
                features: [
                    'All trial features',
                    'Download solutions',
                    'Unlimited code execution',
                    'Advanced exercises',
                    'Priority support'
                ],
                tier: 'premium'
            },
            {
                id: 'premium_annual',
                name: 'Premium Annual',
                price: 99.99,
                currency: 'USD',
                interval: 'yearly',
                features: [
                    'All premium features',
                    '2 months free (12 for price of 10)',
                    'Advanced analytics',
                    'Progress reports'
                ],
                tier: 'premium',
                discountPercentage: 17
            },
            {
                id: 'enterprise',
                name: 'Enterprise',
                price: 299.99,
                currency: 'USD',
                interval: 'yearly',
                features: [
                    'All premium features',
                    'Team management',
                    'Custom exercises',
                    'White-label platform',
                    'Dedicated support'
                ],
                tier: 'enterprise'
            }
        ];
    }

    /**
     * Get plan by ID
     */
    getPlanById(planId: string): PaymentPlan | null {
        return this.getAvailablePlans().find(plan => plan.id === planId) || null;
    }

    /**
     * Calculate upgrade pricing
     */
    calculateUpgradePrice(currentPlan: string, targetPlan: string, daysRemaining?: number): number {
        const current = this.getPlanById(currentPlan);
        const target = this.getPlanById(targetPlan);

        if (!current || !target) {
            throw new Error('Invalid plan IDs');
        }

        if (current.price === 0) {
            // Upgrading from free/trial
            return target.price;
        }

        // Pro-rated pricing calculation
        if (daysRemaining && current.interval === 'monthly') {
            const dailyRate = current.price / 30;
            const refund = dailyRate * daysRemaining;
            return Math.max(0, target.price - refund);
        }

        return target.price;
    }

    /**
     * Process subscription creation
     */
    async createSubscription(userId: string, planId: string, paymentMethodId: string): Promise<{
        success: boolean;
        subscriptionId?: string;
        error?: string;
    }> {
        const plan = this.getPlanById(planId);
        if (!plan) {
            return { success: false, error: 'Invalid plan' };
        }

        try {
            // This would integrate with Stripe/PayPal/etc
            const subscriptionId = await this.processPayment(userId, plan, paymentMethodId);

            // Update user tier
            await this.updateUserTier(userId, plan.tier);

            return { success: true, subscriptionId };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    }

    /**
     * Check subscription status
     */
    async getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
        // This would query payment provider and database
        return {
            status: 'active',
            currentPlan: 'premium_monthly',
            renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            cancelAtPeriodEnd: false
        };
    }

    /**
     * Handle subscription cancellation
     */
    async cancelSubscription(userId: string, immediate: boolean = false): Promise<{
        success: boolean;
        error?: string;
    }> {
        try {
            if (immediate) {
                // Immediate cancellation - refund calculation
                await this.processRefund(userId);
                await this.updateUserTier(userId, 'free');
            } else {
                // Cancel at period end
                await this.scheduleCancellation(userId);
            }

            return { success: true };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    }

    /**
     * Generate invoice
     */
    async generateInvoice(userId: string, planId: string): Promise<Invoice> {
        const plan = this.getPlanById(planId);
        if (!plan) {
            throw new Error('Plan not found');
        }

        return {
            id: `inv_${Date.now()}`,
            userId,
            amount: plan.price,
            currency: plan.currency,
            description: `${plan.name} subscription`,
            status: 'pending',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        };
    }

    // Private helper methods
    private async processPayment(userId: string, plan: PaymentPlan, paymentMethodId: string): Promise<string> {
        // Integration with payment provider (Stripe, PayPal, etc.)
        // This is where the actual payment processing would happen
        return `sub_${Date.now()}`;
    }

    private async updateUserTier(userId: string, tier: UserTier): Promise<void> {
        // Update database with new user tier
        console.log(`Updated user ${userId} to tier ${tier}`);
    }

    private async processRefund(userId: string): Promise<void> {
        // Process refund through payment provider
        console.log(`Processing refund for user ${userId}`);
    }

    private async scheduleCancellation(userId: string): Promise<void> {
        // Schedule cancellation at period end
        console.log(`Scheduled cancellation for user ${userId}`);
    }
}