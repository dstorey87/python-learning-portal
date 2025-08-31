/**
 * Internal Types for @portal/backend
 * Independent type definitions to ensure loose coupling
 */

// Base types for API responses
export interface APIResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    timestamp?: string;
}

// Error handling types
export class AppError extends Error {
    public statusCode: number;
    public isOperational: boolean;

    constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
        super(message);

        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.isOperational = isOperational;

        // Capture stack trace if available
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

// User types
export interface User {
    id: string;
    email: string;
    name: string;
    username?: string; // For backwards compatibility
    display_name?: string;
    learning_streak?: number;
    last_activity?: string;
    created: string;
    updated: string;
    createdAt?: string; // For backwards compatibility
    verified: boolean;
    role?: 'user' | 'admin' | 'premium';
    subscription_status?: 'free' | 'premium' | 'trial';
    subscription_expires?: string;
}

// Exercise types
export interface Exercise {
    id: string;
    title: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    category?: string;
    tags?: string[];
    topics?: string[]; // For backwards compatibility
    instructions: string;
    starterCode: string;
    solutionCode: string;
    testCode: string;
    hints?: string[];
    estimatedTime?: number; // in minutes
    points?: number;
    isPremium?: boolean; // For paywall functionality
    order?: number; // For sorting exercises
}

// Progress tracking types
export interface UserProgress {
    id?: string;
    userId: string;
    exerciseId: string;
    completed: boolean;
    completedAt?: string | Date;
    attempts: number;
    bestScore?: number;
    bestSolution?: string; // For backwards compatibility
    timeSpent: number; // in seconds
    solutionCode?: string;
    feedback?: string;
}

// Code execution types
export interface CodeExecution {
    id: string;
    code: string;
    exerciseId?: string;
    userId?: string;
    createdAt: string;
    runTests?: boolean;
}

export interface TestResult {
    passed: boolean;
    message: string;
    expected?: any;
    actual?: any;
    error?: string;
    errors?: string; // For backwards compatibility
    output?: string;
    testCases?: TestCase[];
    testResult?: TestResult; // For nested results
}

export interface TestCase {
    name?: string;
    passed: boolean;
    message: string;
    expected?: any;
    actual?: any;
    error?: string;
}

export interface CodeExecutionResult {
    success: boolean;
    output: string;
    error?: string;
    errors?: string; // For backwards compatibility
    executionTime: number; // in milliseconds
    testResults?: TestResult[];
    score?: number; // percentage 0-100
    memory?: number; // memory usage in MB
}

// Subscription and payment types (for future paywall)
export interface Subscription {
    id: string;
    userId: string;
    plan: 'free' | 'premium' | 'enterprise';
    status: 'active' | 'cancelled' | 'expired' | 'trial';
    startDate: string;
    endDate?: string;
    features: string[];
    limits: {
        dailyExecutions: number;
        premiumExercises: boolean;
        advancedFeatures: boolean;
    };
}

// Session types
export interface UserSession {
    id: string;
    userId: string;
    sessionStart: string;
    sessionEnd?: string;
    exercisesCompleted: number;
    totalTime: number; // in seconds
    ipAddress?: string;
    userAgent?: string;
}

// Rate limiting and usage tracking
export interface UsageMetrics {
    userId: string;
    date: string; // YYYY-MM-DD
    codeExecutions: number;
    exercisesAttempted: number;
    timeSpent: number; // in seconds
    premiumFeaturesUsed: string[];
}

// Export commonly used types
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type SubscriptionPlan = 'free' | 'premium' | 'enterprise';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial';
export type UserRole = 'user' | 'admin' | 'premium';