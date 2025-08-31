/**
 * Exercises Module Configuration
 * 
 * Provides all Python exercise functionality including editor, execution, testing
 */

module.exports = {
    name: 'exercises',
    displayName: 'Practice Exercises',
    description: 'Interactive Python exercises with code editor and testing',

    // Frontend routes this module provides
    routes: [
        {
            path: '/practice',
            component: 'ExercisesPage',
            title: 'Practice Exercises',
            icon: 'code-bracket',
            showInNav: true,
            navOrder: 20,
            requiresAuth: false,
            permissions: []
        },
        {
            path: '/practice/:exerciseId',
            component: 'ExerciseDetailPage',
            title: 'Exercise',
            showInNav: false,
            requiresAuth: false,
            permissions: []
        }
    ],

    // Backend API endpoints this module provides
    apis: [
        {
            method: 'GET',
            path: '/',
            handler: 'listExercises',
            permissions: [],
            requiresAuth: false
        },
        {
            method: 'GET',
            path: '/:id',
            handler: 'getExercise',
            permissions: [],
            requiresAuth: false
        },
        {
            method: 'POST',
            path: '/:id/execute',
            handler: 'executeCode',
            permissions: ['execute_code'],
            requiresAuth: false
        },
        {
            method: 'POST',
            path: '/:id/test',
            handler: 'runTests',
            permissions: ['run_tests'],
            requiresAuth: false
        },
        {
            method: 'POST',
            path: '/:id/submit',
            handler: 'submitSolution',
            permissions: ['submit_solution'],
            requiresAuth: false
        }
    ],

    // Permissions this module defines
    permissions: [
        'view_exercises',
        'execute_code',
        'run_tests',
        'submit_solution',
        'view_solutions',
        'manage_exercises'
    ],

    // Module dependencies
    dependencies: [],

    // Database configuration
    database: {
        tables: [
            {
                name: 'exercises',
                columns: [
                    { name: 'id', type: 'VARCHAR(50)', primary: true },
                    { name: 'title', type: 'VARCHAR(255)', nullable: false },
                    { name: 'difficulty', type: 'VARCHAR(20)', nullable: false },
                    { name: 'category', type: 'VARCHAR(50)', nullable: false },
                    { name: 'description', type: 'TEXT' },
                    { name: 'instructions', type: 'TEXT', nullable: false },
                    { name: 'starter_code', type: 'TEXT', nullable: false },
                    { name: 'solution_code', type: 'TEXT' },
                    { name: 'test_code', type: 'TEXT', nullable: false },
                    { name: 'concepts', type: 'TEXT' }, // JSON array
                    { name: 'hints', type: 'TEXT' }, // JSON array
                    { name: 'order_index', type: 'INTEGER', default: 0 },
                    { name: 'is_active', type: 'BOOLEAN', default: true },
                    { name: 'created_at', type: 'DATETIME', default: 'CURRENT_TIMESTAMP' },
                    { name: 'updated_at', type: 'DATETIME', default: 'CURRENT_TIMESTAMP' }
                ]
            },
            {
                name: 'exercise_progress',
                columns: [
                    { name: 'id', type: 'INTEGER', primary: true, autoincrement: true },
                    { name: 'user_id', type: 'VARCHAR(50)' },
                    { name: 'exercise_id', type: 'VARCHAR(50)', nullable: false },
                    { name: 'status', type: 'VARCHAR(20)', default: 'not_started' }, // not_started, in_progress, completed
                    { name: 'current_code', type: 'TEXT' },
                    { name: 'attempts', type: 'INTEGER', default: 0 },
                    { name: 'completed_at', type: 'DATETIME' },
                    { name: 'time_spent', type: 'INTEGER', default: 0 }, // seconds
                    { name: 'created_at', type: 'DATETIME', default: 'CURRENT_TIMESTAMP' },
                    { name: 'updated_at', type: 'DATETIME', default: 'CURRENT_TIMESTAMP' }
                ],
                indexes: [
                    { columns: ['user_id', 'exercise_id'], unique: true }
                ]
            }
        ]
    },

    // Paywall configuration
    paywall: {
        freeTier: {
            maxUsage: 10, // exercises per day
            features: ['basic_exercises', 'code_execution', 'basic_tests']
        },
        premiumFeatures: [
            'advanced_exercises',
            'unlimited_execution',
            'detailed_solutions',
            'progress_analytics',
            'custom_exercises'
        ]
    },

    // Module initialization function
    async initialize(coreServices) {
        console.log('🚀 Initializing Exercises module...');

        // Load exercises from data directory
        const exerciseLoader = require('./src/services/ExerciseLoader');
        await exerciseLoader.loadExercisesFromDirectory('./modules/exercises/data');

        // Set up event listeners
        coreServices.eventBus.on('user.logged_in', (data) => {
            console.log('Exercises: User logged in', data.userId);
            // Load user's exercise progress
        });

        coreServices.eventBus.on('user.progress_updated', (data) => {
            console.log('Exercises: Progress updated', data);
            // Update exercise progress tracking
        });

        console.log('✅ Exercises module initialized');
    },

    // Module shutdown function
    async shutdown() {
        console.log('🛑 Shutting down Exercises module...');
        // Clean up Python execution processes
    }
};