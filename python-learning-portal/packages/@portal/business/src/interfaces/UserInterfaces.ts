/**
 * User Management Interfaces
 * 
 * Centralized user management for expansion and paywalling
 */

export type UserTier = 'free' | 'premium' | 'enterprise' | 'trial';

export interface User {
    id: string;
    email: string;
    name: string;
    tier: UserTier;
    createdAt: Date;
    lastActive: Date;
    metadata: Record<string, any>;
}

export interface UserProfile extends User {
    preferences: UserPreferences;
    progress: UserProgress;
    subscription?: UserSubscription;
}

export interface UserPreferences {
    theme: 'light' | 'dark';
    notifications: boolean;
    autoSave: boolean;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface UserProgress {
    completedExercises: string[];
    currentStreak: number;
    totalTimeSpent: number; // minutes
    skillLevels: Record<string, number>;
    achievements: string[];
}

export interface UserSubscription {
    id: string;
    tier: UserTier;
    status: 'active' | 'cancelled' | 'expired' | 'trial';
    startDate: Date;
    endDate?: Date;
    autoRenew: boolean;
    paymentMethod?: string;
}

export interface UserSession {
    userId: string;
    token: string;
    expiresAt: Date;
    permissions: string[];
}

export interface UserPermissions {
    canAccessPremiumContent: boolean;
    canDownloadSolutions: boolean;
    canAccessAdvancedFeatures: boolean;
    maxExecutionsPerHour: number;
    canUseAIHints: boolean;
}