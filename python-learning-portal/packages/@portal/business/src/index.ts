/**
 * @portal/business - Centralized Business Logic Package
 * 
 * THE SINGLE SOURCE OF TRUTH for all business decisions.
 * Other packages import from here, never from individual services.
 * 
 * Want to add paywalling? Only modify this package.
 * Want new subscription plans? Only modify this package.
 * Want new premium features? Only modify this package.
 */

// Primary Business Interface
export { BusinessFacade, getBusinessFacade } from './BusinessFacade';

// Convenience Functions for Other Packages
export {
    canUserAccess,
    getAvailablePlans,
    canExecuteCode
} from './BusinessFacade';

// Type Definitions (for other packages to use)
export type { BusinessDecision, BusinessContext, BusinessRule } from './interfaces/BusinessInterfaces';
export type { UserTier, UserPermissions } from './interfaces/UserInterfaces';
export type { PaymentPlan, SubscriptionStatus, Invoice } from './interfaces/PaymentInterfaces';
export type { AnalyticsEvent, ABTestConfig } from './interfaces/AnalyticsInterfaces';

// Services (generally not needed by other packages, but available if needed)
export { AccessControlService } from './services/AccessControlService';
export { PaymentService } from './services/PaymentService';

/**
 * HOW OTHER PACKAGES USE THIS:
 * 
 * Frontend:
 *   import { canUserAccess } from '@portal/business';
 *   const decision = await canUserAccess({ userId, exerciseId, action: 'view_exercise' });
 *   if (!decision.allowed) showPaywall(decision.redirect);
 * 
 * Backend:
 *   import { getBusinessFacade } from '@portal/business';
 *   const business = getBusinessFacade();
 *   const canAccess = await business.canAccessExercise(userId, exerciseId);
 * 
 * Executor:
 *   import { canExecuteCode } from '@portal/business';
 *   const decision = await canExecuteCode(userId);
 *   if (!decision.allowed) return { error: decision.reason };
 * 
 * THIS IS TRUE LOOSE COUPLING:
 * - Other packages ask business questions
 * - They don't make business decisions
 * - All business logic centralized here
 * - Adding paywalling = only modify this package
 */