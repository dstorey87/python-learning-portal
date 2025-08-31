/**
 * Exercises Module Entry Point
 */

// Export API handlers
export * from './api/exerciseHandlers';

// Export services
export * from './services/PythonExecutor';
export * from './services/ExerciseLoader';

// Module metadata
export const moduleInfo = {
    name: 'exercises',
    version: '1.0.0',
    description: 'Interactive Python exercises with code editor and testing'
};