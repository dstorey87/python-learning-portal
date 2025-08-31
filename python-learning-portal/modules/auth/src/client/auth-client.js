/**
 * PocketBase Authentication Client
 * 
 * Provides complete authentication functionality for the Python Learning Portal
 * Features: Login, Registration, Profile Management, Usage Tracking, Feature Flags
 */

const PocketBase = require('pocketbase/cjs');

class AuthClient {
    constructor(url = 'http://localhost:8090') {
        this.pb = new PocketBase(url);
        this.isInitialized = false;
        this._userProfile = null;
        this._featureFlags = new Map();

        // Auto-initialize
        this.init();
    }

    async init() {
        try {
            // Check PocketBase health
            await this.pb.health.check();

            // Load existing auth from localStorage
            this.pb.authStore.loadFromCookie(document?.cookie || '');

            // Load user profile if authenticated
            if (this.pb.authStore.isValid) {
                await this.loadUserProfile();
                await this.loadFeatureFlags();
            }

            this.isInitialized = true;
            console.log('✅ AuthClient initialized');
        } catch (error) {
            console.error('❌ AuthClient initialization failed:', error);
            throw error;
        }
    }

    // === AUTHENTICATION ===

    async login(email, password) {
        try {
            const authData = await this.pb.collection('users').authWithPassword(email, password);
            await this.loadUserProfile();
            await this.loadFeatureFlags();

            this.emit('auth:login', { user: authData.record });
            return authData;
        } catch (error) {
            console.error('Login failed:', error);
            throw new Error(error.message || 'Login failed');
        }
    }

    async register(email, password, name, passwordConfirm = null) {
        try {
            // Create user
            const userData = {
                email,
                password,
                passwordConfirm: passwordConfirm || password,
                name: name || email.split('@')[0],
                emailVisibility: true
            };

            const user = await this.pb.collection('users').create(userData);

            // Auto-login after registration
            const authData = await this.login(email, password);

            // Create user profile with default settings
            await this.createUserProfile(authData.record.id);

            this.emit('auth:register', { user: authData.record });
            return authData;
        } catch (error) {
            console.error('Registration failed:', error);
            throw new Error(error.message || 'Registration failed');
        }
    }

    async logout() {
        try {
            this.pb.authStore.clear();
            this._userProfile = null;
            this._featureFlags.clear();

            this.emit('auth:logout');
            console.log('✅ Logged out successfully');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }

    async sendPasswordReset(email) {
        try {
            await this.pb.collection('users').requestPasswordReset(email);
            return { message: 'Password reset email sent' };
        } catch (error) {
            console.error('Password reset failed:', error);
            throw new Error(error.message || 'Password reset failed');
        }
    }

    // === USER PROFILE ===

    async createUserProfile(userId) {
        try {
            const profile = await this.pb.collection('user_profiles').create({
                user: userId,
                subscription_tier: 'free',
                tier_expires_at: null,
                preferences: {
                    theme: 'light',
                    difficulty: 'beginner',
                    notifications: true,
                    progress_tracking: true
                }
            });

            this._userProfile = profile;
            return profile;
        } catch (error) {
            console.error('Failed to create user profile:', error);
            throw error;
        }
    }

    async loadUserProfile() {
        if (!this.pb.authStore.isValid) return null;

        try {
            const profiles = await this.pb.collection('user_profiles').getList(1, 1, {
                filter: `user = "${this.pb.authStore.model.id}"`
            });

            if (profiles.items.length > 0) {
                this._userProfile = profiles.items[0];
            } else {
                // Create profile if it doesn't exist
                await this.createUserProfile(this.pb.authStore.model.id);
            }

            return this._userProfile;
        } catch (error) {
            console.error('Failed to load user profile:', error);
            return null;
        }
    }

    async updateUserProfile(updates) {
        if (!this._userProfile) {
            throw new Error('User profile not loaded');
        }

        try {
            this._userProfile = await this.pb.collection('user_profiles').update(
                this._userProfile.id,
                updates
            );

            this.emit('profile:updated', { profile: this._userProfile });
            return this._userProfile;
        } catch (error) {
            console.error('Failed to update user profile:', error);
            throw error;
        }
    }

    async upgradeTier(tier, expiresAt = null) {
        try {
            const updates = {
                subscription_tier: tier,
                tier_expires_at: expiresAt
            };

            await this.updateUserProfile(updates);
            await this.loadFeatureFlags(); // Reload feature flags

            this.emit('tier:upgraded', { tier, expiresAt });
            return this._userProfile;
        } catch (error) {
            console.error('Failed to upgrade tier:', error);
            throw error;
        }
    }

    // === USAGE TRACKING ===

    async trackUsage(type, count = 1) {
        if (!this.pb.authStore.isValid) return;

        try {
            const today = new Date().toISOString().split('T')[0];

            // Check if usage record exists for today
            const existingUsage = await this.pb.collection('usage_tracking').getList(1, 1, {
                filter: `user = "${this.pb.authStore.model.id}" && date >= "${today} 00:00:00" && date < "${today} 23:59:59" && type = "${type}"`
            });

            if (existingUsage.items.length > 0) {
                // Update existing record
                await this.pb.collection('usage_tracking').update(existingUsage.items[0].id, {
                    count: existingUsage.items[0].count + count
                });
            } else {
                // Create new record
                await this.pb.collection('usage_tracking').create({
                    user: this.pb.authStore.model.id,
                    date: new Date().toISOString(),
                    type,
                    count
                });
            }

            this.emit('usage:tracked', { type, count });
        } catch (error) {
            console.error('Failed to track usage:', error);
        }
    }

    async getUsageStats(days = 30) {
        if (!this.pb.authStore.isValid) return {};

        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const usage = await this.pb.collection('usage_tracking').getList(1, 100, {
                filter: `user = "${this.pb.authStore.model.id}" && date >= "${startDate.toISOString()}"`,
                sort: '-date'
            });

            // Group by type
            const stats = {};
            usage.items.forEach(record => {
                if (!stats[record.type]) {
                    stats[record.type] = {
                        total: 0,
                        daily: {}
                    };
                }

                const date = record.date.split('T')[0];
                stats[record.type].total += record.count;
                stats[record.type].daily[date] = (stats[record.type].daily[date] || 0) + record.count;
            });

            return stats;
        } catch (error) {
            console.error('Failed to get usage stats:', error);
            return {};
        }
    }

    // === FEATURE FLAGS ===

    async loadFeatureFlags() {
        try {
            const flags = await this.pb.collection('feature_flags').getList(1, 100, {
                filter: 'enabled = true'
            });

            this._featureFlags.clear();
            flags.items.forEach(flag => {
                this._featureFlags.set(flag.name, flag);
            });

            this.emit('features:loaded', { flags: flags.items });
        } catch (error) {
            console.error('Failed to load feature flags:', error);
        }
    }

    isFeatureEnabled(featureName) {
        const flag = this._featureFlags.get(featureName);
        if (!flag || !flag.enabled) return false;

        // Check tier requirement
        if (flag.required_tier && this._userProfile) {
            const userTier = this._userProfile.subscription_tier;
            const requiredTier = flag.required_tier;

            // Tier hierarchy: free < premium < enterprise
            const tierLevels = { free: 0, premium: 1, enterprise: 2 };

            if (tierLevels[userTier] < tierLevels[requiredTier]) {
                return false;
            }
        }

        return true;
    }

    getFeatureConfig(featureName) {
        const flag = this._featureFlags.get(featureName);
        if (!flag || !this.isFeatureEnabled(featureName)) return null;

        return flag.config || {};
    }

    // === PAYWALL CONTROLS ===

    async checkAccess(featureName, usageType = null, count = 1) {
        if (!this.isFeatureEnabled(featureName)) {
            return {
                allowed: false,
                reason: 'feature_disabled',
                message: 'This feature is not available for your subscription tier.',
                requiredTier: this._featureFlags.get(featureName)?.required_tier || 'premium'
            };
        }

        const config = this.getFeatureConfig(featureName);

        // Check usage limits
        if (config.limit && config.limit > 0 && usageType) {
            const stats = await this.getUsageStats(1); // Today only
            const todayUsage = stats[usageType]?.total || 0;

            if (todayUsage + count > config.limit) {
                return {
                    allowed: false,
                    reason: 'usage_limit_exceeded',
                    message: `Daily limit reached (${config.limit}/${config.limit}).`,
                    currentUsage: todayUsage,
                    limit: config.limit
                };
            }
        }

        return {
            allowed: true,
            config
        };
    }

    // === GETTERS ===

    get isAuthenticated() {
        return this.pb.authStore.isValid;
    }

    get user() {
        return this.pb.authStore.model;
    }

    get userProfile() {
        return this._userProfile;
    }

    get subscriptionTier() {
        return this._userProfile?.subscription_tier || 'free';
    }

    get featureFlags() {
        return Array.from(this._featureFlags.values());
    }

    // === EVENT EMITTER ===

    emit(eventName, data = {}) {
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            const event = new CustomEvent(`pocketbase:${eventName}`, {
                detail: data
            });
            window.dispatchEvent(event);
        }
    }

    on(eventName, callback) {
        if (typeof window !== 'undefined' && window.addEventListener) {
            window.addEventListener(`pocketbase:${eventName}`, (event) => {
                callback(event.detail);
            });
        }
    }
}

// Singleton instance
let authClientInstance = null;

function getAuthClient(url = 'http://localhost:8090') {
    if (!authClientInstance) {
        authClientInstance = new AuthClient(url);
    }
    return authClientInstance;
}

module.exports = { AuthClient, getAuthClient };