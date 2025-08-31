/**
 * Exercises Module API Handlers
 */

import { Request, Response } from 'express';

export const listExercises = async (req: Request, res: Response) => {
    try {
        const coreServices = (global as any).coreServices;
        const db = coreServices.database;

        const exercises = await db.all(`
      SELECT 
        id, title, description, instructions, starter_code, test_code, solution_code,
        difficulty, category, concepts, hints, order_index, is_active, 
        created_at, updated_at
      FROM exercises 
      WHERE is_active = 1
      ORDER BY order_index ASC
    `);

        // Parse JSON fields
        const parsedExercises = exercises.map((exercise: any) => ({
            id: exercise.id,
            title: exercise.title,
            description: exercise.description,
            instructions: exercise.instructions,
            starterCode: exercise.starter_code,
            testCode: exercise.test_code,
            solutionCode: exercise.solution_code,
            difficulty: exercise.difficulty,
            category: exercise.category,
            concepts: exercise.concepts ? JSON.parse(exercise.concepts) : [],
            hints: exercise.hints ? JSON.parse(exercise.hints) : [],
            order: exercise.order_index,
            isActive: Boolean(exercise.is_active),
            createdAt: exercise.created_at,
            updatedAt: exercise.updated_at
        }));

        res.json({
            success: true,
            data: parsedExercises,
            module: 'exercises'
        });
    } catch (error) {
        console.error('Error in listExercises:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch exercises',
            module: 'exercises'
        });
    }
};

export const getExercise = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const coreServices = (global as any).coreServices;
        const db = coreServices.database;

        const exercise = await db.get(`
      SELECT 
        id, title, description, instructions, starter_code, test_code, solution_code,
        difficulty, category, concepts, hints, order_index, is_active,
        created_at, updated_at
      FROM exercises 
      WHERE id = ? AND is_active = 1
    `, [id]);

        if (!exercise) {
            return res.status(404).json({
                success: false,
                error: 'Exercise not found',
                module: 'exercises'
            });
        }

        const parsedExercise = {
            id: exercise.id,
            title: exercise.title,
            description: exercise.description,
            instructions: exercise.instructions,
            starterCode: exercise.starter_code,
            testCode: exercise.test_code,
            solutionCode: exercise.solution_code,
            difficulty: exercise.difficulty,
            category: exercise.category,
            concepts: exercise.concepts ? JSON.parse(exercise.concepts) : [],
            hints: exercise.hints ? JSON.parse(exercise.hints) : [],
            order: exercise.order_index,
            isActive: Boolean(exercise.is_active),
            createdAt: exercise.created_at,
            updatedAt: exercise.updated_at
        };

        res.json({
            success: true,
            data: parsedExercise,
            module: 'exercises'
        });
    } catch (error) {
        console.error('Error in getExercise:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch exercise',
            module: 'exercises'
        });
    }
};

export const executeCode = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { code } = req.body;

        if (!code || typeof code !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Code is required and must be a string',
                module: 'exercises'
            });
        }

        // Import the execution service
        const { PythonExecutor } = require('../services/PythonExecutor');
        const executor = new PythonExecutor();

        const result = await executor.executeCode(code, false);

        res.json({
            success: true,
            data: result,
            module: 'exercises'
        });
    } catch (error) {
        console.error('Error in executeCode:', error);
        res.status(500).json({
            success: false,
            error: 'Code execution failed',
            module: 'exercises'
        });
    }
};

export const runTests = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { code } = req.body;

        if (!code || typeof code !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Code is required and must be a string',
                module: 'exercises'
            });
        }

        // Import the execution service
        const { PythonExecutor } = require('../services/PythonExecutor');
        const executor = new PythonExecutor();

        const result = await executor.executeCodeWithTests(code, id);

        res.json({
            success: true,
            data: result,
            module: 'exercises'
        });
    } catch (error) {
        console.error('Error in runTests:', error);
        res.status(500).json({
            success: false,
            error: 'Test execution failed',
            module: 'exercises'
        });
    }
};

export const submitSolution = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { code, userId = 'guest' } = req.body;

        const coreServices = (global as any).coreServices;
        const db = coreServices.database;

        // First run tests to validate solution
        const { PythonExecutor } = require('../services/PythonExecutor');
        const executor = new PythonExecutor();
        const testResult = await executor.executeCodeWithTests(code, id);

        // Update progress
        await db.run(`
      INSERT OR REPLACE INTO exercise_progress 
      (user_id, exercise_id, status, current_code, attempts, completed_at, updated_at)
      VALUES (?, ?, ?, ?, 
        COALESCE((SELECT attempts FROM exercise_progress WHERE user_id = ? AND exercise_id = ?), 0) + 1,
        ?, CURRENT_TIMESTAMP)
    `, [
            userId,
            id,
            testResult.success ? 'completed' : 'in_progress',
            code,
            userId,
            id,
            testResult.success ? new Date().toISOString() : null
        ]);

        // Emit progress event
        coreServices.eventBus.emit('exercise.submitted', {
            userId,
            exerciseId: id,
            code,
            passed: testResult.success,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            data: {
                passed: testResult.success,
                testResult,
                progress: testResult.success ? 'completed' : 'in_progress'
            },
            module: 'exercises'
        });
    } catch (error) {
        console.error('Error in submitSolution:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit solution',
            module: 'exercises'
        });
    }
};