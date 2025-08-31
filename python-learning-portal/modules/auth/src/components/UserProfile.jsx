/**
 * User Profile Component
 * Displays and manages user profile information
 */

import React, { useState, useEffect } from 'react';
import { AuthClient } from '../client/auth-client';
import { TierBadge } from './PaywallComponents';

export function UserProfile({ onClose }) {
    const [userProfile, setUserProfile] = useState(null);
    const [usage, setUsage] = useState({});
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [preferences, setPreferences] = useState({});
    const [saving, setSaving] = useState(false);

    const authClient = AuthClient.getInstance();

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const [profile, usageStats] = await Promise.all([
                authClient.getUserProfile(),
                authClient.getUsageStats()
            ]);

            setUserProfile(profile);
            setUsage(usageStats);
            setPreferences(profile?.preferences || {});
        } catch (error) {
            console.error('Failed to load user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSavePreferences = async () => {
        setSaving(true);
        try {
            await authClient.updateUserProfile({ preferences });
            setEditing(false);
            await loadUserData(); // Reload to get updated data
        } catch (error) {
            console.error('Failed to save preferences:', error);
            alert('Failed to save preferences. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            await authClient.logout();
            if (onClose) onClose();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-center mt-2 text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    const user = authClient.getCurrentUser();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full mx-4 p-6 max-h-screen overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">User Profile</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <span className="sr-only">Close</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* User Info */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                            {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900">
                                {user?.name || 'User'}
                            </h3>
                            <p className="text-gray-600">{user?.email}</p>
                            <div className="mt-2">
                                <TierBadge tier={userProfile?.subscription_tier || 'free'} size="lg" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Usage Statistics */}
                <div className="mb-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Usage Statistics</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.entries(usage).map(([type, stats]) => (
                            <div key={type} className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="text-sm text-gray-500 capitalize">{type.replace('_', ' ')}</div>
                                <div className="text-2xl font-bold text-gray-900 mt-1">
                                    {stats.total || 0}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">Total</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Preferences */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium text-gray-900">Preferences</h4>
                        {!editing ? (
                            <button
                                onClick={() => setEditing(true)}
                                className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                            >
                                Edit
                            </button>
                        ) : (
                            <div className="space-x-2">
                                <button
                                    onClick={() => {
                                        setEditing(false);
                                        setPreferences(userProfile?.preferences || {});
                                    }}
                                    className="text-gray-600 hover:text-gray-500 text-sm font-medium"
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSavePreferences}
                                    className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        {/* Theme */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Theme
                            </label>
                            {editing ? (
                                <select
                                    value={preferences.theme || 'light'}
                                    onChange={(e) => setPreferences(prev => ({ ...prev, theme: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="light">Light</option>
                                    <option value="dark">Dark</option>
                                    <option value="auto">Auto</option>
                                </select>
                            ) : (
                                <p className="text-gray-900 capitalize">
                                    {preferences.theme || 'light'}
                                </p>
                            )}
                        </div>

                        {/* Difficulty */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Difficulty Level
                            </label>
                            {editing ? (
                                <select
                                    value={preferences.difficulty || 'beginner'}
                                    onChange={(e) => setPreferences(prev => ({ ...prev, difficulty: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                </select>
                            ) : (
                                <p className="text-gray-900 capitalize">
                                    {preferences.difficulty || 'beginner'}
                                </p>
                            )}
                        </div>

                        {/* Notifications */}
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Email Notifications
                                </label>
                                <p className="text-sm text-gray-500">
                                    Receive updates about new exercises and features
                                </p>
                            </div>
                            {editing ? (
                                <input
                                    type="checkbox"
                                    checked={preferences.notifications !== false}
                                    onChange={(e) => setPreferences(prev => ({ ...prev, notifications: e.target.checked }))}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                            ) : (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${preferences.notifications !== false
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {preferences.notifications !== false ? 'Enabled' : 'Disabled'}
                                </span>
                            )}
                        </div>

                        {/* Progress Tracking */}
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Progress Tracking
                                </label>
                                <p className="text-sm text-gray-500">
                                    Track your learning progress and statistics
                                </p>
                            </div>
                            {editing ? (
                                <input
                                    type="checkbox"
                                    checked={preferences.progress_tracking !== false}
                                    onChange={(e) => setPreferences(prev => ({ ...prev, progress_tracking: e.target.checked }))}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                            ) : (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${preferences.progress_tracking !== false
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {preferences.progress_tracking !== false ? 'Enabled' : 'Disabled'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Account Actions */}
                <div className="pt-6 border-t border-gray-200">
                    <div className="space-y-3">
                        <button
                            onClick={() => {/* TODO: Handle password change */ }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                        >
                            Change Password
                        </button>

                        <button
                            onClick={() => {/* TODO: Handle export data */ }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                        >
                            Export My Data
                        </button>

                        <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}