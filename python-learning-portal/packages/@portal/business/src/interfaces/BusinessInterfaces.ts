/**
 * Core Business Logic Interfaces
 * 
 * These interfaces define how business logic should work.
 * All expansion features (paywalling, premium, etc.) go through these contracts.
 */

export interface BusinessRule {
    name: string;
    description: string;
    evaluate(context: BusinessContext): Promise<boolean>;
}

export interface BusinessContext {
    userId?: string;
    exerciseId?: string;
    action: string;
    metadata?: Record<string, any>;
}

export interface BusinessDecision {
    allowed: boolean;
    reason?: string;
    redirect?: string;
    metadata?: Record<string, any>;
}

export interface AccessPolicy {
    resource: string;
    action: string;
    rules: BusinessRule[];
}

export interface FeatureFlag {
    name: string;
    enabled: boolean;
    rolloutPercentage?: number;
    userSegments?: string[];
    metadata?: Record<string, any>;
}

export interface BusinessEvent {
    type: string;
    userId?: string;
    data: Record<string, any>;
    timestamp: Date;
}

export interface BusinessMetrics {
    [key: string]: number | string | boolean;
}