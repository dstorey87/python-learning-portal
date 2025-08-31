/**
 * Access Control Service
 * 
 * THE SINGLE SOURCE OF TRUTH for all access decisions.
 * Want to add paywalling? Only modify this service.
 */

import { BusinessDecision, BusinessContext } from '../interfaces/BusinessInterfaces';
import { UserTier, UserPermissions } from '../interfaces/UserInterfaces';

export class AccessControlService {

    /**
     * THE MAIN GATE: All access decisions flow through here
     */
    async canUserAccess(context: BusinessContext): Promise<BusinessDecision> {
        const userId = context.userId;
        const exerciseId = context.exerciseId;
        const action = context.action;

        // Get user tier (this would come from database in real implementation)
        const userTier = await this.getUserTier(userId);
        const permissions = this.getUserPermissions(userTier);

        switch (action) {
            case 'view_exercise':
                return this.checkExerciseAccess(exerciseId, permissions);

            case 'execute_code':
                return this.checkCodeExecution(permissions, userId);

            case 'view_solution':
                return this.checkSolutionAccess(permissions);

            case 'download_content':
                return this.checkDownloadAccess(permissions);

            case 'use_ai_hints':
                return this.checkAIHintsAccess(permissions);

            default:
                return { allowed: false, reason: 'Unknown action' };
        }
    }

    /**
     * Exercise access logic - expandable for premium exercises
     */
    private async checkExerciseAccess(exerciseId: string | undefined, permissions: UserPermissions): Promise<BusinessDecision> {
        if (!exerciseId) {
            return { allowed: false, reason: 'Exercise ID required' };
        }

        // Check if exercise is premium (expandable)
        const isPremium = await this.isExercisePremium(exerciseId);

        if (isPremium && !permissions.canAccessPremiumContent) {
            return {
                allowed: false,
                reason: 'Premium content requires subscription',
                redirect: '/upgrade'
            };
        }

        return { allowed: true };
    }

    /**
     * Code execution rate limiting and premium features
     */
    private async checkCodeExecution(permissions: UserPermissions, userId?: string): Promise<BusinessDecision> {
        if (!userId) {
            return { allowed: true }; // Guest users allowed basic execution
        }

        // Check rate limits
        const executionsThisHour = await this.getExecutionsCount(userId);

        if (executionsThisHour >= permissions.maxExecutionsPerHour) {
            return {
                allowed: false,
                reason: `Execution limit reached (${permissions.maxExecutionsPerHour}/hour). Upgrade for unlimited executions.`,
                redirect: '/upgrade'
            };
        }

        return { allowed: true };
    }

    /**
     * Solution access - premium feature
     */
    private checkSolutionAccess(permissions: UserPermissions): BusinessDecision {
        if (!permissions.canDownloadSolutions) {
            return {
                allowed: false,
                reason: 'Solution access requires premium subscription',
                redirect: '/upgrade'
            };
        }

        return { allowed: true };
    }

    /**
     * Download access control
     */
    private checkDownloadAccess(permissions: UserPermissions): BusinessDecision {
        if (!permissions.canDownloadSolutions) {
            return {
                allowed: false,
                reason: 'Downloads require premium subscription',
                redirect: '/upgrade'
            };
        }

        return { allowed: true };
    }

    /**
     * AI hints - premium feature
     */
    private checkAIHintsAccess(permissions: UserPermissions): BusinessDecision {
        if (!permissions.canUseAIHints) {
            return {
                allowed: false,
                reason: 'AI hints require premium subscription',
                redirect: '/upgrade'
            };
        }

        return { allowed: true };
    }

    /**
     * Get user permissions based on tier
     */
    private getUserPermissions(tier: UserTier): UserPermissions {
        const permissionsMap: Record<UserTier, UserPermissions> = {
            free: {
                canAccessPremiumContent: false,
                canDownloadSolutions: false,
                canAccessAdvancedFeatures: false,
                maxExecutionsPerHour: 10,
                canUseAIHints: false,
            },
            trial: {
                canAccessPremiumContent: true,
                canDownloadSolutions: false,
                canAccessAdvancedFeatures: true,
                maxExecutionsPerHour: 50,
                canUseAIHints: true,
            },
            premium: {
                canAccessPremiumContent: true,
                canDownloadSolutions: true,
                canAccessAdvancedFeatures: true,
                maxExecutionsPerHour: 1000,
                canUseAIHints: true,
            },
            enterprise: {
                canAccessPremiumContent: true,
                canDownloadSolutions: true,
                canAccessAdvancedFeatures: true,
                maxExecutionsPerHour: 10000,
                canUseAIHints: true,
            },
        };

        return permissionsMap[tier];
    }

    // These would be implemented with actual database calls
    private async getUserTier(userId?: string): Promise<UserTier> {
        // Default to free for now
        return userId ? 'free' : 'free';
    }

    private async isExercisePremium(exerciseId: string): Promise<boolean> {
        // For now, mark advanced exercises as premium
        const premiumExercises = ['E8_ops_module', 'E9_bug_hunt'];
        return premiumExercises.includes(exerciseId);
    }

    private async getExecutionsCount(userId: string): Promise<number> {
        // Would check database for actual count
        return 0;
    }
}