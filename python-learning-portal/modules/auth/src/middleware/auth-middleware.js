/**
 * Authentication Middleware for Express.js
 * 
 * Provides middleware functions for:
 * - Authentication verification
 * - Feature access control
 * - Usage tracking
 * - Rate limiting
 */

const PocketBase = require('pocketbase/cjs');

class AuthMiddleware {
    constructor(pocketbaseUrl = 'http://localhost:8090') {
        this.pb = new PocketBase(pocketbaseUrl);
    }

    /**
     * Verify authentication token
     */
    authenticate() {
        return async (req, res, next) => {
            try {
                const authHeader = req.headers.authorization;
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    return res.status(401).json({
                        error: 'Authentication required',
                        message: 'Please provide a valid authentication token'
                    });
                }

                const token = authHeader.substring(7);

                // Verify token with PocketBase
                this.pb.authStore.save(token, null);

                // Check if token is valid
                if (!this.pb.authStore.isValid) {
                    return res.status(401).json({
                        error: 'Invalid token',
                        message: 'Authentication token is invalid or expired'
                    });
                }

                // Load user data
                const user = this.pb.authStore.model;
                req.user = user;
                req.pb = this.pb;

                next();
            } catch (error) {
                console.error('Authentication error:', error);
                return res.status(401).json({
                    error: 'Authentication failed',
                    message: error.message
                });
            }
        };
    }

    /**
     * Require specific subscription tier
     */
    requireTier(requiredTier) {
        return async (req, res, next) => {
            try {
                if (!req.user) {
                    return res.status(401).json({
                        error: 'Authentication required'
                    });
                }

                // Load user profile
                const profiles = await req.pb.collection('user_profiles').getList(1, 1, {
                    filter: `user = "${req.user.id}"`
                });

                if (profiles.items.length === 0) {
                    return res.status(400).json({
                        error: 'User profile not found',
                        message: 'Please complete your profile setup'
                    });
                }

                const userProfile = profiles.items[0];
                const userTier = userProfile.subscription_tier;

                // Check tier hierarchy: free < premium < enterprise
                const tierLevels = { free: 0, premium: 1, enterprise: 2 };

                if (tierLevels[userTier] < tierLevels[requiredTier]) {
                    return res.status(403).json({
                        error: 'Insufficient subscription tier',
                        message: `This feature requires ${requiredTier} subscription. You currently have ${userTier}.`,
                        currentTier: userTier,
                        requiredTier: requiredTier,
                        upgradeRequired: true
                    });
                }

                req.userProfile = userProfile;
                next();
            } catch (error) {
                console.error('Tier check error:', error);
                return res.status(500).json({
                    error: 'Tier verification failed',
                    message: error.message
                });
            }
        };
    }

    /**
     * Check feature flag access
     */
    requireFeature(featureName) {
        return async (req, res, next) => {
            try {
                if (!req.user) {
                    return res.status(401).json({
                        error: 'Authentication required'
                    });
                }

                // Load feature flag
                const flags = await req.pb.collection('feature_flags').getList(1, 1, {
                    filter: `name = "${featureName}" && enabled = true`
                });

                if (flags.items.length === 0) {
                    return res.status(403).json({
                        error: 'Feature not available',
                        message: `The feature '${featureName}' is currently disabled or does not exist.`
                    });
                }

                const flag = flags.items[0];

                // Check tier requirement
                if (flag.required_tier) {
                    if (!req.userProfile) {
                        // Load user profile if not already loaded
                        const profiles = await req.pb.collection('user_profiles').getList(1, 1, {
                            filter: `user = "${req.user.id}"`
                        });

                        if (profiles.items.length === 0) {
                            return res.status(400).json({
                                error: 'User profile not found'
                            });
                        }

                        req.userProfile = profiles.items[0];
                    }

                    const userTier = req.userProfile.subscription_tier;
                    const requiredTier = flag.required_tier;
                    const tierLevels = { free: 0, premium: 1, enterprise: 2 };

                    if (tierLevels[userTier] < tierLevels[requiredTier]) {
                        return res.status(403).json({
                            error: 'Insufficient subscription tier',
                            message: `This feature requires ${requiredTier} subscription.`,
                            currentTier: userTier,
                            requiredTier: requiredTier,
                            featureName: featureName
                        });
                    }
                }

                req.featureFlag = flag;
                req.featureConfig = flag.config || {};
                next();
            } catch (error) {
                console.error('Feature check error:', error);
                return res.status(500).json({
                    error: 'Feature verification failed',
                    message: error.message
                });
            }
        };
    }

    /**
     * Track usage with optional limits
     */
    trackUsage(usageType, count = 1) {
        return async (req, res, next) => {
            try {
                if (!req.user) {
                    return next(); // Skip if not authenticated
                }

                const today = new Date().toISOString().split('T')[0];

                // Check existing usage for today
                const existingUsage = await req.pb.collection('usage_tracking').getList(1, 1, {
                    filter: `user = "${req.user.id}" && date >= "${today} 00:00:00" && date < "${today} 23:59:59" && type = "${usageType}"`
                });

                let currentUsage = 0;
                if (existingUsage.items.length > 0) {
                    currentUsage = existingUsage.items[0].count;
                }

                // Check usage limits from feature config
                if (req.featureConfig && req.featureConfig.limit && req.featureConfig.limit > 0) {
                    if (currentUsage + count > req.featureConfig.limit) {
                        return res.status(429).json({
                            error: 'Usage limit exceeded',
                            message: `Daily limit of ${req.featureConfig.limit} exceeded.`,
                            currentUsage,
                            limit: req.featureConfig.limit,
                            usageType
                        });
                    }
                }

                // Track the usage (will be updated after successful request)
                req.trackUsage = {
                    type: usageType,
                    count,
                    currentUsage
                };

                next();
            } catch (error) {
                console.error('Usage tracking error:', error);
                // Don't fail the request for usage tracking errors
                next();
            }
        };
    }

    /**
     * Update usage after successful request
     */
    updateUsageAfterSuccess() {
        return async (req, res, next) => {
            // Hook into response finish event
            const originalSend = res.send;

            res.send = async function (data) {
                // Only track if request was successful (2xx status)
                if (req.trackUsage && res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const { type, count } = req.trackUsage;
                        const today = new Date().toISOString().split('T')[0];

                        const existingUsage = await req.pb.collection('usage_tracking').getList(1, 1, {
                            filter: `user = "${req.user.id}" && date >= "${today} 00:00:00" && date < "${today} 23:59:59" && type = "${type}"`
                        });

                        if (existingUsage.items.length > 0) {
                            // Update existing record
                            await req.pb.collection('usage_tracking').update(existingUsage.items[0].id, {
                                count: existingUsage.items[0].count + count
                            });
                        } else {
                            // Create new record
                            await req.pb.collection('usage_tracking').create({
                                user: req.user.id,
                                date: new Date().toISOString(),
                                type,
                                count
                            });
                        }
                    } catch (error) {
                        console.error('Failed to update usage:', error);
                    }
                }

                originalSend.call(this, data);
            };

            next();
        };
    }

    /**
     * Rate limiting based on subscription tier
     */
    rateLimit(requests = { free: 10, premium: 100, enterprise: 1000 }) {
        const rateLimitMap = new Map();

        return async (req, res, next) => {
            try {
                if (!req.user) {
                    return next(); // Skip if not authenticated
                }

                const userId = req.user.id;
                const now = Date.now();
                const windowMs = 60 * 1000; // 1 minute window

                // Load user profile to determine tier
                if (!req.userProfile) {
                    const profiles = await req.pb.collection('user_profiles').getList(1, 1, {
                        filter: `user = "${userId}"`
                    });

                    if (profiles.items.length > 0) {
                        req.userProfile = profiles.items[0];
                    }
                }

                const userTier = req.userProfile?.subscription_tier || 'free';
                const limit = requests[userTier] || requests.free;

                // Get or create rate limit entry
                if (!rateLimitMap.has(userId)) {
                    rateLimitMap.set(userId, {
                        count: 0,
                        resetTime: now + windowMs
                    });
                }

                const rateLimit = rateLimitMap.get(userId);

                // Reset if window expired
                if (now > rateLimit.resetTime) {
                    rateLimit.count = 0;
                    rateLimit.resetTime = now + windowMs;
                }

                // Check limit
                if (rateLimit.count >= limit) {
                    return res.status(429).json({
                        error: 'Rate limit exceeded',
                        message: `Too many requests. Limit: ${limit} requests per minute for ${userTier} tier.`,
                        limit,
                        resetTime: rateLimit.resetTime,
                        tier: userTier
                    });
                }

                // Increment count
                rateLimit.count++;
                rateLimitMap.set(userId, rateLimit);

                // Add headers
                res.set({
                    'X-RateLimit-Limit': limit,
                    'X-RateLimit-Remaining': limit - rateLimit.count,
                    'X-RateLimit-Reset': rateLimit.resetTime
                });

                next();
            } catch (error) {
                console.error('Rate limit error:', error);
                // Don't fail the request for rate limiting errors
                next();
            }
        };
    }

    /**
     * Optional authentication (don't fail if not authenticated)
     */
    optionalAuth() {
        return async (req, res, next) => {
            try {
                const authHeader = req.headers.authorization;
                if (authHeader && authHeader.startsWith('Bearer ')) {
                    const token = authHeader.substring(7);
                    this.pb.authStore.save(token, null);

                    if (this.pb.authStore.isValid) {
                        req.user = this.pb.authStore.model;
                        req.pb = this.pb;
                    }
                }
            } catch (error) {
                // Ignore authentication errors for optional auth
                console.log('Optional auth failed (ignored):', error.message);
            }

            next();
        };
    }

    /**
     * Admin only access
     */
    requireAdmin() {
        return async (req, res, next) => {
            try {
                if (!req.user) {
                    return res.status(401).json({
                        error: 'Authentication required'
                    });
                }

                // Check if user has admin privileges
                // This could be based on a role field or admin flag
                if (!req.user.admin) {
                    return res.status(403).json({
                        error: 'Admin access required',
                        message: 'This endpoint requires administrator privileges.'
                    });
                }

                next();
            } catch (error) {
                console.error('Admin check error:', error);
                return res.status(500).json({
                    error: 'Admin verification failed',
                    message: error.message
                });
            }
        };
    }
}

module.exports = AuthMiddleware;