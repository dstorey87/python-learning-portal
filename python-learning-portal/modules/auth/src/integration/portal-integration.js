/**
 * Python Learning Portal Integration Script
 * Integrates the authentication module with the existing portal
 */

const express = require('express');
const cors = require('cors');
const AuthMiddleware = require('./modules/auth/src/middleware/auth-middleware');
const authRoutes = require('./modules/auth/src/api/auth-routes');

class PortalAuthIntegration {
    constructor(app) {
        this.app = app;
        this.authMiddleware = new AuthMiddleware();
    }

    /**
     * Initialize authentication integration
     */
    initialize() {
        // Enable CORS for authentication endpoints
        this.app.use('/api/auth', cors({
            origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
            credentials: true
        }));

        // Add authentication routes
        this.app.use('/api/auth', authRoutes);

        // Add authentication to existing endpoints
        this.protectExistingRoutes();

        // Add usage tracking to exercise endpoints
        this.addUsageTracking();

        // Add paywall checks to premium features
        this.addPaywallChecks();

        console.log('✅ Authentication integration completed');
    }

    /**
     * Protect existing routes that need authentication
     */
    protectExistingRoutes() {
        // Protect user profile routes
        this.app.use('/api/profile', this.authMiddleware.authenticate());

        // Protect progress tracking
        this.app.use('/api/progress', this.authMiddleware.authenticate());

        // Add optional auth to exercise routes (for usage tracking)
        this.app.use('/api/exercises', this.authMiddleware.optionalAuth());

        console.log('✅ Protected existing routes');
    }

    /**
     * Add usage tracking to exercise-related endpoints
     */
    addUsageTracking() {
        // Track exercise runs
        this.app.use('/api/exercises/*/run',
            this.authMiddleware.trackUsage('exercise_runs', {
                limit: this.getTierLimit('exercise_runs'),
                period: 'daily'
            })
        );

        // Track test runs
        this.app.use('/api/exercises/*/test',
            this.authMiddleware.trackUsage('test_runs', {
                limit: this.getTierLimit('test_runs'),
                period: 'daily'
            })
        );

        console.log('✅ Added usage tracking');
    }

    /**
     * Add paywall checks for premium features
     */
    addPaywallChecks() {
        // Advanced exercises require premium
        this.app.use('/api/exercises/advanced/*',
            this.authMiddleware.authenticate(),
            this.authMiddleware.requireFeature('advanced_exercises')
        );

        // Detailed analytics require premium
        this.app.use('/api/analytics/detailed',
            this.authMiddleware.authenticate(),
            this.authMiddleware.requireFeature('detailed_analytics')
        );

        // Code explanations require premium
        this.app.use('/api/exercises/*/explanation',
            this.authMiddleware.authenticate(),
            this.authMiddleware.requireFeature('code_explanations')
        );

        console.log('✅ Added paywall checks');
    }

    /**
     * Get tier-based usage limits
     */
    getTierLimit(usageType) {
        const tierLimits = {
            free: {
                exercise_runs: 10,
                test_runs: 20,
                api_calls: 100
            },
            premium: {
                exercise_runs: -1, // unlimited
                test_runs: -1,
                api_calls: 1000
            },
            enterprise: {
                exercise_runs: -1,
                test_runs: -1,
                api_calls: -1
            }
        };

        // Return function that determines limit based on user's tier
        return async (req) => {
            if (!req.userProfile) return tierLimits.free[usageType];
            const tier = req.userProfile.subscription_tier || 'free';
            return tierLimits[tier]?.[usageType] || tierLimits.free[usageType];
        };
    }

    /**
     * Add authentication-aware middleware to existing exercise endpoints
     */
    enhanceExerciseEndpoints() {
        const router = express.Router();

        // Enhanced exercise list with tier filtering
        router.get('/', async (req, res) => {
            try {
                // Get all exercises
                const exercises = await this.getExercises();

                let filteredExercises = exercises;

                // Filter based on user tier if authenticated
                if (req.user) {
                    const userTier = req.userProfile?.subscription_tier || 'free';
                    filteredExercises = exercises.map(exercise => ({
                        ...exercise,
                        locked: this.isExerciseLocked(exercise, userTier),
                        tier_required: this.getExerciseTier(exercise)
                    }));
                }

                res.json({
                    success: true,
                    data: { exercises: filteredExercises },
                    user_tier: req.userProfile?.subscription_tier || 'free'
                });
            } catch (error) {
                res.status(500).json({
                    error: 'Failed to load exercises',
                    message: error.message
                });
            }
        });

        // Enhanced exercise run with usage tracking
        router.post('/:exerciseId/run', async (req, res) => {
            try {
                const { exerciseId } = req.params;
                const { code } = req.body;

                // Check if exercise is accessible
                const exercise = await this.getExercise(exerciseId);
                if (!exercise) {
                    return res.status(404).json({
                        error: 'Exercise not found'
                    });
                }

                const userTier = req.userProfile?.subscription_tier || 'free';
                if (this.isExerciseLocked(exercise, userTier)) {
                    return res.status(403).json({
                        error: 'Premium feature',
                        message: 'This exercise requires a premium subscription',
                        tier_required: this.getExerciseTier(exercise)
                    });
                }

                // Run the exercise
                const result = await this.runExercise(exerciseId, code);

                // Track success/failure if authenticated
                if (req.user) {
                    const successType = result.success ? 'successful_runs' : 'failed_runs';
                    await this.authMiddleware.trackUsage(successType, { limit: null });
                }

                res.json({
                    success: true,
                    data: result,
                    usage_tracked: req.usageTracked
                });
            } catch (error) {
                res.status(500).json({
                    error: 'Failed to run exercise',
                    message: error.message
                });
            }
        });

        return router;
    }

    /**
     * Helper methods for exercise management
     */
    async getExercises() {
        // Implementation depends on your existing exercise loading logic
        const fs = require('fs').promises;
        const path = require('path');

        try {
            const exercisesDir = path.join(__dirname, 'exercises');
            const exercises = [];
            const exerciseFolders = await fs.readdir(exercisesDir);

            for (const folder of exerciseFolders) {
                if (folder.startsWith('E')) {
                    const exercisePath = path.join(exercisesDir, folder);
                    const instructionsPath = path.join(exercisePath, 'instructions.md');

                    try {
                        const instructions = await fs.readFile(instructionsPath, 'utf-8');
                        exercises.push({
                            id: folder,
                            name: this.extractExerciseName(instructions),
                            description: this.extractExerciseDescription(instructions),
                            difficulty: this.getExerciseDifficulty(folder),
                            type: this.getExerciseType(folder)
                        });
                    } catch (error) {
                        console.warn(`Failed to load exercise ${folder}:`, error.message);
                    }
                }
            }

            return exercises;
        } catch (error) {
            console.error('Failed to load exercises:', error);
            return [];
        }
    }

    async getExercise(exerciseId) {
        const exercises = await this.getExercises();
        return exercises.find(ex => ex.id === exerciseId);
    }

    isExerciseLocked(exercise, userTier) {
        const tierLevels = { free: 0, premium: 1, enterprise: 2 };
        const requiredTier = this.getExerciseTier(exercise);

        const userLevel = tierLevels[userTier] || 0;
        const requiredLevel = tierLevels[requiredTier] || 0;

        return userLevel < requiredLevel;
    }

    getExerciseTier(exercise) {
        // Determine tier based on exercise properties
        if (exercise.id.includes('advanced') || exercise.difficulty === 'advanced') {
            return 'premium';
        }
        if (exercise.type === 'enterprise' || exercise.id.includes('enterprise')) {
            return 'enterprise';
        }
        return 'free';
    }

    getExerciseDifficulty(exerciseId) {
        const difficultyMap = {
            'E0': 'beginner',
            'E1': 'beginner',
            'E2': 'beginner',
            'E3': 'intermediate',
            'E4': 'intermediate',
            'E5': 'intermediate',
            'E6': 'advanced',
            'E7': 'advanced',
            'E8': 'advanced',
            'E9': 'advanced'
        };

        const prefix = exerciseId.substring(0, 2);
        return difficultyMap[prefix] || 'beginner';
    }

    getExerciseType(exerciseId) {
        if (exerciseId.includes('_module')) return 'module';
        if (exerciseId.includes('_ops')) return 'operations';
        return 'exercise';
    }

    extractExerciseName(instructions) {
        const match = instructions.match(/^#\s+(.+)/m);
        return match ? match[1] : 'Untitled Exercise';
    }

    extractExerciseDescription(instructions) {
        const lines = instructions.split('\n');
        const descStart = lines.findIndex(line => line.trim() && !line.startsWith('#'));
        return descStart >= 0 ? lines[descStart].trim() : '';
    }

    async runExercise(exerciseId, code) {
        // Implementation depends on your existing exercise runner
        // This is a placeholder that should integrate with your Python execution system

        try {
            const { spawn } = require('child_process');
            const path = require('path');

            return new Promise((resolve, reject) => {
                const pythonProcess = spawn('python', ['-c', code], {
                    cwd: path.join(__dirname, 'exercises', exerciseId)
                });

                let output = '';
                let error = '';

                pythonProcess.stdout.on('data', (data) => {
                    output += data.toString();
                });

                pythonProcess.stderr.on('data', (data) => {
                    error += data.toString();
                });

                pythonProcess.on('close', (code) => {
                    resolve({
                        success: code === 0,
                        output: output,
                        error: error,
                        exit_code: code
                    });
                });

                pythonProcess.on('error', (err) => {
                    reject(err);
                });
            });
        } catch (error) {
            return {
                success: false,
                error: error.message,
                output: '',
                exit_code: -1
            };
        }
    }
}

module.exports = PortalAuthIntegration;