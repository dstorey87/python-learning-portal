/**
 * Paywall Component
 * Shows tier restrictions and upgrade prompts
 */

import React, { useState, useEffect } from 'react';
import { AuthClient } from '../client/auth-client';

export function PaywallModal({ feature, config, onClose, onUpgrade }) {
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const authClient = AuthClient.getInstance();

    useEffect(() => {
        const loadUserProfile = async () => {
            try {
                const profile = await authClient.getUserProfile();
                setUserProfile(profile);
            } catch (error) {
                console.error('Failed to load user profile:', error);
            } finally {
                setLoading(false);
            }
        };

        loadUserProfile();
    }, []);

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-center mt-2 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    const currentTier = userProfile?.subscription_tier || 'free';
    const requiredTier = config?.required_tier || 'premium';

    const tierInfo = {
        free: {
            name: 'Free',
            color: 'gray',
            features: ['Basic exercises', 'Limited attempts', 'Community support']
        },
        premium: {
            name: 'Premium',
            color: 'blue',
            price: '$9.99/month',
            features: ['All exercises', 'Unlimited attempts', 'Priority support', 'Progress analytics', 'Code explanations']
        },
        enterprise: {
            name: 'Enterprise',
            color: 'purple',
            price: '$29.99/month',
            features: ['Everything in Premium', 'Advanced analytics', 'Custom exercises', 'Team management', 'API access']
        }
    };

    const currentTierInfo = tierInfo[currentTier];
    const requiredTierInfo = tierInfo[requiredTier];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                        <span className="text-2xl">🔒</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Premium Feature</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        This feature requires {requiredTierInfo.name} access
                    </p>
                </div>

                {/* Feature Description */}
                <div className="mb-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">
                            {feature || 'Advanced Feature'}
                        </h4>
                        <p className="text-sm text-gray-600">
                            {config?.description || 'This feature provides enhanced functionality to help you learn Python more effectively.'}
                        </p>
                    </div>
                </div>

                {/* Current vs Required Tier */}
                <div className="mb-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-3">
                        <div>
                            <p className="text-sm font-medium text-gray-900">Your Plan</p>
                            <p className={`text-sm text-${currentTierInfo.color}-600`}>
                                {currentTierInfo.name}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">Required Plan</p>
                            <p className={`text-sm text-${requiredTierInfo.color}-600`}>
                                {requiredTierInfo.name}
                            </p>
                        </div>
                    </div>

                    {/* Upgrade Benefits */}
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-900">
                            Upgrade to {requiredTierInfo.name} and get:
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1">
                            {requiredTierInfo.features.map((feature, index) => (
                                <li key={index} className="flex items-center">
                                    <span className="text-green-500 mr-2">✓</span>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Pricing */}
                {requiredTierInfo.price && (
                    <div className="mb-6 text-center">
                        <div className="bg-blue-50 rounded-lg p-4">
                            <p className="text-2xl font-bold text-blue-600">
                                {requiredTierInfo.price}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                                Cancel anytime • 7-day free trial
                            </p>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={() => onUpgrade && onUpgrade(requiredTier)}
                        className={`w-full py-2 px-4 rounded-md text-white font-medium bg-${requiredTierInfo.color}-600 hover:bg-${requiredTierInfo.color}-700 focus:outline-none focus:ring-2 focus:ring-${requiredTierInfo.color}-500 focus:ring-offset-2`}
                    >
                        Upgrade to {requiredTierInfo.name}
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full py-2 px-4 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                        Maybe Later
                    </button>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

export function UsageLimitBanner({ usage, limits, onUpgrade }) {
    const [dismissed, setDismissed] = useState(false);

    if (dismissed || !usage || !limits) return null;

    const usagePercentage = Math.min((usage.total / limits.daily) * 100, 100);
    const isNearLimit = usagePercentage > 80;
    const isOverLimit = usagePercentage >= 100;

    if (!isNearLimit) return null;

    return (
        <div className={`rounded-md p-4 mb-4 ${isOverLimit ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
            } border`}>
            <div className="flex">
                <div className="flex-shrink-0">
                    <span className="text-2xl">
                        {isOverLimit ? '🚫' : '⚠️'}
                    </span>
                </div>
                <div className="ml-3 flex-1">
                    <h3 className={`text-sm font-medium ${isOverLimit ? 'text-red-800' : 'text-yellow-800'
                        }`}>
                        {isOverLimit ? 'Daily Limit Reached' : 'Approaching Daily Limit'}
                    </h3>
                    <div className="mt-2">
                        <p className={`text-sm ${isOverLimit ? 'text-red-700' : 'text-yellow-700'
                            }`}>
                            You've used {usage.total} of {limits.daily} daily {usage.type} executions
                            {isOverLimit && ' and have reached your limit for today'}.
                        </p>

                        {/* Usage Bar */}
                        <div className="mt-3">
                            <div className="bg-white rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all duration-300 ${isOverLimit ? 'bg-red-500' : 'bg-yellow-500'
                                        }`}
                                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Upgrade CTA */}
                    <div className="mt-4">
                        <div className="-mx-2 -my-1.5 flex">
                            <button
                                onClick={() => onUpgrade && onUpgrade('premium')}
                                className={`px-2 py-1.5 rounded-md text-sm font-medium ${isOverLimit
                                        ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                        : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                    } focus:outline-none focus:ring-2 focus:ring-offset-2 ${isOverLimit ? 'focus:ring-red-600' : 'focus:ring-yellow-600'
                                    }`}
                            >
                                Upgrade for Unlimited
                            </button>
                            <button
                                onClick={() => setDismissed(true)}
                                className={`ml-3 px-2 py-1.5 rounded-md text-sm font-medium ${isOverLimit
                                        ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                        : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                    } focus:outline-none focus:ring-2 focus:ring-offset-2 ${isOverLimit ? 'focus:ring-red-600' : 'focus:ring-yellow-600'
                                    }`}
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function TierBadge({ tier, size = 'sm' }) {
    const tierConfig = {
        free: { color: 'gray', icon: '🆓' },
        premium: { color: 'blue', icon: '⭐' },
        enterprise: { color: 'purple', icon: '💎' }
    };

    const config = tierConfig[tier] || tierConfig.free;
    const sizeClasses = size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2 py-1 text-xs';

    return (
        <span className={`inline-flex items-center ${sizeClasses} rounded-full bg-${config.color}-100 text-${config.color}-800 font-medium`}>
            <span className="mr-1">{config.icon}</span>
            {tier.charAt(0).toUpperCase() + tier.slice(1)}
        </span>
    );
}