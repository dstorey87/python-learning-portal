/**
 * Business Facade - THE SINGLE ENTRY POINT
 * 
 * This is where ALL business logic flows through.
 * Want to add paywalling? This is the ONLY place you need to touch.
 * 
 * Other packages NEVER make business decisions.
 * They only ask this facade "Can the user do X?"
 */

import { AccessControlService } from './services/AccessControlService';
import { PaymentService } from './services/PaymentService';
import { BusinessDecision, BusinessContext } from './interfaces/BusinessInterfaces';
import { PaymentPlan } from './interfaces/PaymentInterfaces';
import { UserTier } from './interfaces/UserInterfaces';

export class BusinessFacade {
    private accessControl: AccessControlService;
    private paymentService: PaymentService;

    constructor() {
        this.accessControl = new AccessControlService();
        this.paymentService = new PaymentService();
    }

    // ========================================
    // PRIMARY BUSINESS DECISION INTERFACE
    // ========================================

    /**
     * THE MAIN BUSINESS GATE
     * All access decisions flow through here
     */
    async canUserAccess(context: BusinessContext): Promise<BusinessDecision> {
        return this.accessControl.canUserAccess(context);
    }

    // ========================================
    // PAYMENT & SUBSCRIPTION INTERFACE
    // ========================================

    /**
     * Get available payment plans
     */
    getAvailablePlans(): PaymentPlan[] {
        return this.paymentService.getAvailablePlans();
    }

    /**
     * Subscribe user to a plan
     */
    async subscribeUser(userId: string, planId: string, paymentMethodId: string) {
        return this.paymentService.createSubscription(userId, planId, paymentMethodId);
    }

    /**
     * Cancel user subscription
     */
    async cancelSubscription(userId: string, immediate: boolean = false) {
        return this.paymentService.cancelSubscription(userId, immediate);
    }

    /**
     * Get subscription status
     */
    async getSubscriptionStatus(userId: string) {
        return this.paymentService.getSubscriptionStatus(userId);
    }

    // ========================================
    // BUSINESS RULES FOR SPECIFIC SCENARIOS
    // ========================================

    /**
     * Can user access this specific exercise?
     */
    async canAccessExercise(userId: string | undefined, exerciseId: string): Promise<BusinessDecision> {
        return this.canUserAccess({
            userId,
            exerciseId,
            action: 'view_exercise'
        });
    }

    /**
     * Can user execute code right now?
     */
    async canExecuteCode(userId: string | undefined): Promise<BusinessDecision> {
        return this.canUserAccess({
            userId,
            action: 'execute_code'
        });
    }

    /**
     * Can user view solutions?
     */
    async canViewSolutions(userId: string | undefined): Promise<BusinessDecision> {
        return this.canUserAccess({
            userId,
            action: 'view_solution'
        });
    }

    /**
     * Can user download content?
     */
    async canDownloadContent(userId: string | undefined): Promise<BusinessDecision> {
        return this.canUserAccess({
            userId,
            action: 'download_content'
        });
    }

    /**
     * Can user use AI hints?
     */
    async canUseAIHints(userId: string | undefined): Promise<BusinessDecision> {
        return this.canUserAccess({
            userId,
            action: 'use_ai_hints'
        });
    }

    // ========================================
    // BUSINESS ANALYTICS & TRACKING
    // ========================================

    /**
     * Track business events (conversions, usage, etc.)
     */
    async trackEvent(userId: string | undefined, event: string, metadata?: Record<string, any>): Promise<void> {
        // This would integrate with analytics services
        console.log(`Business Event: ${event}`, { userId, metadata });
    }

    /**
     * Track premium upgrade conversion attempt
     */
    async trackUpgradeAttempt(userId: string | undefined, triggeredBy: string): Promise<void> {
        await this.trackEvent(userId, 'upgrade_attempt', { triggeredBy });
    }

    /**
     * Track successful conversion
     */
    async trackConversion(userId: string, planId: string): Promise<void> {
        await this.trackEvent(userId, 'conversion_success', { planId });
    }

    // ========================================
    // DEMONSTRATION: HOW PAYWALLING WORKS
    // ========================================

    /**
     * DEMO: This is how you'd add paywalling to ANY feature
     * Only this business package needs to change
     */

    /**
     * Example: New premium feature - AI Code Review
     */
    async canUseAICodeReview(userId: string | undefined): Promise<BusinessDecision> {
        return this.canUserAccess({
            userId,
            action: 'use_ai_code_review' // Just add this new action
        });
    }

    /**
     * Example: New premium feature - Advanced Debugging
     */
    async canUseAdvancedDebugging(userId: string | undefined): Promise<BusinessDecision> {
        return this.canUserAccess({
            userId,
            action: 'use_advanced_debugging' // Just add this new action
        });
    }

    /**
     * Example: New premium feature - Team Collaboration
     */
    async canUseTeamFeatures(userId: string | undefined): Promise<BusinessDecision> {
        return this.canUserAccess({
            userId,
            action: 'use_team_features' // Just add this new action
        });
    }
}

// ========================================
// SINGLETON PATTERN - ONE BUSINESS FACADE
// ========================================

let businessInstance: BusinessFacade | null = null;

/**
 * Get the single business facade instance
 * All packages import this, not individual services
 */
export function getBusinessFacade(): BusinessFacade {
    if (!businessInstance) {
        businessInstance = new BusinessFacade();
    }
    return businessInstance;
}

// ========================================
// CONVENIENCE EXPORTS FOR OTHER PACKAGES
// ========================================

/**
 * Frontend can import just this function
 */
export async function canUserAccess(context: BusinessContext): Promise<BusinessDecision> {
    return getBusinessFacade().canUserAccess(context);
}

/**
 * Backend can import just this function
 */
export async function getAvailablePlans(): Promise<PaymentPlan[]> {
    return getBusinessFacade().getAvailablePlans();
}

/**
 * Executor can import just this function
 */
export async function canExecuteCode(userId?: string): Promise<BusinessDecision> {
    return getBusinessFacade().canExecuteCode(userId);
}