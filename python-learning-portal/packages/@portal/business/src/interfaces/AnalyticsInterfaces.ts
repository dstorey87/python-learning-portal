/**
 * Analytics and Tracking Interfaces
 * 
 * Business intelligence and user behavior tracking
 */

export interface AnalyticsEvent {
    type: string;
    userId?: string;
    sessionId?: string;
    data: Record<string, any>;
    timestamp: Date;
    source: 'frontend' | 'backend' | 'mobile';
}

export interface UserAnalytics {
    userId: string;
    sessionCount: number;
    totalTimeSpent: number;
    exercisesCompleted: number;
    averageSessionDuration: number;
    lastActive: Date;
    conversionFunnel: ConversionStage[];
}

export interface ConversionStage {
    stage: string;
    timestamp: Date;
    completed: boolean;
}

export interface BusinessMetrics {
    dailyActiveUsers: number;
    monthlyActiveUsers: number;
    conversionRate: number;
    churnRate: number;
    revenuePerUser: number;
    exerciseCompletionRate: number;
}

export interface A_BTest {
    id: string;
    name: string;
    description: string;
    variants: A_BVariant[];
    status: 'draft' | 'running' | 'completed';
    startDate: Date;
    endDate?: Date;
    targetMetric: string;
}

export interface ABTestConfig {
    testId: string;
    variantId: string;
    config: Record<string, any>;
}

export interface A_BVariant {
    id: string;
    name: string;
    weight: number; // percentage
    config: Record<string, any>;
    metrics: Record<string, number>;
}

export interface AnalyticsQuery {
    metric: string;
    dimensions: string[];
    filters: Record<string, any>;
    dateRange: {
        start: Date;
        end: Date;
    };
}

export interface AnalyticsResult {
    data: Record<string, any>[];
    totalCount: number;
    aggregations: Record<string, number>;
}