/**
 * Authentication API Routes
 * 
 * Provides REST API endpoints for:
 * - Login/Register/Logout
 * - Profile management
 * - Usage statistics
 * - Feature flag access
 * - Subscription management
 */

const express = require('express');
const PocketBase = require('pocketbase/cjs');
const AuthMiddleware = require('../middleware/auth-middleware');

const router = express.Router();
const authMiddleware = new AuthMiddleware();

// Initialize PocketBase client
const pb = new PocketBase('http://localhost:8090');

// === AUTHENTICATION ENDPOINTS ===

/**
 * POST /auth/login
 * Authenticate user with email and password
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: 'Missing credentials',
                message: 'Email and password are required'
            });
        }

        // Authenticate with PocketBase
        const authData = await pb.collection('users').authWithPassword(email, password);

        // Load user profile
        let userProfile = null;
        try {
            const profiles = await pb.collection('user_profiles').getList(1, 1, {
                filter: `user = "${authData.record.id}"`
            });

            if (profiles.items.length === 0) {
                // Create profile if it doesn't exist
                userProfile = await pb.collection('user_profiles').create({
                    user: authData.record.id,
                    subscription_tier: 'free',
                    tier_expires_at: null,
                    preferences: {
                        theme: 'light',
                        difficulty: 'beginner',
                        notifications: true,
                        progress_tracking: true
                    }
                });
            } else {
                userProfile = profiles.items[0];
            }
        } catch (error) {
            console.error('Failed to load/create user profile:', error);
        }

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: authData.record.id,
                    email: authData.record.email,
                    name: authData.record.name,
                    verified: authData.record.verified,
                    avatar: authData.record.avatar
                },
                profile: userProfile,
                token: authData.token
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(401).json({
            error: 'Login failed',
            message: error.message || 'Invalid email or password'
        });
    }
});

/**
 * POST /auth/register
 * Register new user account
 */
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, passwordConfirm } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: 'Missing credentials',
                message: 'Email and password are required'
            });
        }

        // Create user
        const userData = {
            email,
            password,
            passwordConfirm: passwordConfirm || password,
            name: name || email.split('@')[0],
            emailVisibility: true
        };

        const user = await pb.collection('users').create(userData);

        // Auto-login after registration
        const authData = await pb.collection('users').authWithPassword(email, password);

        // Create user profile
        const userProfile = await pb.collection('user_profiles').create({
            user: authData.record.id,
            subscription_tier: 'free',
            tier_expires_at: null,
            preferences: {
                theme: 'light',
                difficulty: 'beginner',
                notifications: true,
                progress_tracking: true
            }
        });

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                user: {
                    id: authData.record.id,
                    email: authData.record.email,
                    name: authData.record.name,
                    verified: authData.record.verified,
                    avatar: authData.record.avatar
                },
                profile: userProfile,
                token: authData.token
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({
            error: 'Registration failed',
            message: error.message || 'Failed to create account'
        });
    }
});

/**
 * POST /auth/logout
 * Logout user (clear token on client side)
 */
router.post('/logout', authMiddleware.authenticate(), (req, res) => {
    res.json({
        success: true,
        message: 'Logout successful'
    });
});

/**
 * POST /auth/password-reset
 * Request password reset email
 */
router.post('/password-reset', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                error: 'Missing email',
                message: 'Email is required'
            });
        }

        await pb.collection('users').requestPasswordReset(email);

        res.json({
            success: true,
            message: 'Password reset email sent'
        });

    } catch (error) {
        console.error('Password reset error:', error);
        res.status(400).json({
            error: 'Password reset failed',
            message: error.message
        });
    }
});

// === PROFILE ENDPOINTS ===

/**
 * GET /auth/profile
 * Get current user profile
 */
router.get('/profile', authMiddleware.authenticate(), async (req, res) => {
    try {
        // Load user profile
        const profiles = await req.pb.collection('user_profiles').getList(1, 1, {
            filter: `user = "${req.user.id}"`
        });

        if (profiles.items.length === 0) {
            return res.status(404).json({
                error: 'Profile not found',
                message: 'User profile does not exist'
            });
        }

        res.json({
            success: true,
            data: {
                user: {
                    id: req.user.id,
                    email: req.user.email,
                    name: req.user.name,
                    verified: req.user.verified,
                    avatar: req.user.avatar
                },
                profile: profiles.items[0]
            }
        });

    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            error: 'Failed to fetch profile',
            message: error.message
        });
    }
});

/**
 * PUT /auth/profile
 * Update user profile
 */
router.put('/profile', authMiddleware.authenticate(), async (req, res) => {
    try {
        const { preferences, subscription_tier, tier_expires_at } = req.body;

        // Load existing profile
        const profiles = await req.pb.collection('user_profiles').getList(1, 1, {
            filter: `user = "${req.user.id}"`
        });

        if (profiles.items.length === 0) {
            return res.status(404).json({
                error: 'Profile not found',
                message: 'User profile does not exist'
            });
        }

        const profile = profiles.items[0];
        const updates = {};

        if (preferences) {
            updates.preferences = { ...profile.preferences, ...preferences };
        }

        // Only allow tier updates by admin or through payment flow
        if (subscription_tier && req.user.admin) {
            updates.subscription_tier = subscription_tier;
        }

        if (tier_expires_at && req.user.admin) {
            updates.tier_expires_at = tier_expires_at;
        }

        const updatedProfile = await req.pb.collection('user_profiles').update(
            profile.id,
            updates
        );

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: { profile: updatedProfile }
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            error: 'Failed to update profile',
            message: error.message
        });
    }
});

// === USAGE TRACKING ENDPOINTS ===

/**
 * GET /auth/usage
 * Get user's usage statistics
 */
router.get('/usage', authMiddleware.authenticate(), async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const usage = await req.pb.collection('usage_tracking').getList(1, 100, {
            filter: `user = "${req.user.id}" && date >= "${startDate.toISOString()}"`,
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

        res.json({
            success: true,
            data: {
                stats,
                period: `${days} days`,
                totalRecords: usage.items.length
            }
        });

    } catch (error) {
        console.error('Usage stats error:', error);
        res.status(500).json({
            error: 'Failed to fetch usage statistics',
            message: error.message
        });
    }
});

/**
 * POST /auth/usage
 * Track usage (manual tracking)
 */
router.post('/usage', authMiddleware.authenticate(), async (req, res) => {
    try {
        const { type, count = 1 } = req.body;

        if (!type) {
            return res.status(400).json({
                error: 'Missing usage type',
                message: 'Usage type is required'
            });
        }

        const today = new Date().toISOString().split('T')[0];

        // Check existing usage for today
        const existingUsage = await req.pb.collection('usage_tracking').getList(1, 1, {
            filter: `user = "${req.user.id}" && date >= "${today} 00:00:00" && date < "${today} 23:59:59" && type = "${type}"`
        });

        let updatedUsage;
        if (existingUsage.items.length > 0) {
            // Update existing record
            updatedUsage = await req.pb.collection('usage_tracking').update(existingUsage.items[0].id, {
                count: existingUsage.items[0].count + count
            });
        } else {
            // Create new record
            updatedUsage = await req.pb.collection('usage_tracking').create({
                user: req.user.id,
                date: new Date().toISOString(),
                type,
                count
            });
        }

        res.json({
            success: true,
            message: 'Usage tracked successfully',
            data: { usage: updatedUsage }
        });

    } catch (error) {
        console.error('Usage tracking error:', error);
        res.status(500).json({
            error: 'Failed to track usage',
            message: error.message
        });
    }
});

// === FEATURE FLAGS ENDPOINTS ===

/**
 * GET /auth/features
 * Get available feature flags for current user
 */
router.get('/features', authMiddleware.optionalAuth(), async (req, res) => {
    try {
        // Load all enabled feature flags
        const flags = await pb.collection('feature_flags').getList(1, 100, {
            filter: 'enabled = true'
        });

        let userProfile = null;
        if (req.user) {
            // Load user profile to check tier
            const profiles = await req.pb.collection('user_profiles').getList(1, 1, {
                filter: `user = "${req.user.id}"`
            });
            userProfile = profiles.items[0] || null;
        }

        const userTier = userProfile?.subscription_tier || 'free';
        const tierLevels = { free: 0, premium: 1, enterprise: 2 };

        // Filter flags based on user's tier
        const availableFlags = flags.items.map(flag => {
            const isAvailable = !flag.required_tier ||
                tierLevels[userTier] >= tierLevels[flag.required_tier];

            return {
                name: flag.name,
                enabled: flag.enabled,
                available: isAvailable,
                required_tier: flag.required_tier,
                config: isAvailable ? flag.config : null
            };
        });

        res.json({
            success: true,
            data: {
                features: availableFlags,
                userTier: userTier,
                isAuthenticated: !!req.user
            }
        });

    } catch (error) {
        console.error('Feature flags error:', error);
        res.status(500).json({
            error: 'Failed to fetch feature flags',
            message: error.message
        });
    }
});

/**
 * GET /auth/features/:featureName/check
 * Check if user has access to specific feature
 */
router.get('/features/:featureName/check',
    authMiddleware.authenticate(),
    authMiddleware.requireFeature(req => req.params.featureName),
    (req, res) => {
        res.json({
            success: true,
            data: {
                feature: req.params.featureName,
                hasAccess: true,
                config: req.featureConfig,
                userTier: req.userProfile?.subscription_tier || 'free'
            }
        });
    }
);

// === SUBSCRIPTION ENDPOINTS ===

/**
 * POST /auth/upgrade
 * Upgrade user's subscription tier (admin only for now)
 */
router.post('/upgrade',
    authMiddleware.authenticate(),
    authMiddleware.requireAdmin(),
    async (req, res) => {
        try {
            const { userId, tier, expiresAt } = req.body;

            if (!userId || !tier) {
                return res.status(400).json({
                    error: 'Missing required fields',
                    message: 'User ID and tier are required'
                });
            }

            // Validate tier
            if (!['free', 'premium', 'enterprise'].includes(tier)) {
                return res.status(400).json({
                    error: 'Invalid tier',
                    message: 'Tier must be free, premium, or enterprise'
                });
            }

            // Load user profile
            const profiles = await req.pb.collection('user_profiles').getList(1, 1, {
                filter: `user = "${userId}"`
            });

            if (profiles.items.length === 0) {
                return res.status(404).json({
                    error: 'User profile not found'
                });
            }

            // Update subscription
            const updatedProfile = await req.pb.collection('user_profiles').update(
                profiles.items[0].id,
                {
                    subscription_tier: tier,
                    tier_expires_at: expiresAt || null
                }
            );

            res.json({
                success: true,
                message: 'Subscription upgraded successfully',
                data: { profile: updatedProfile }
            });

        } catch (error) {
            console.error('Upgrade error:', error);
            res.status(500).json({
                error: 'Failed to upgrade subscription',
                message: error.message
            });
        }
    }
);

// === HEALTH CHECK ===

/**
 * GET /auth/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
    try {
        // Check PocketBase connection
        await pb.health.check();

        res.json({
            success: true,
            message: 'Authentication service is healthy',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            message: 'Authentication service is unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;