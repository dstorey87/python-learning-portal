import { Router, Request, Response } from 'express';
import { getDatabase } from '../database/init';
import { v4 as uuidv4 } from 'uuid';
import { APIResponse, UserProgress, AppError } from '../types';

const router = Router();

// GET /api/progress/:userId/:exerciseId - Get specific exercise progress (MUST come first!)
router.get('/:userId/:exerciseId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, exerciseId } = req.params;

    const db = getDatabase();

    const progressData = await db.get(`
      SELECT 
        exercise_id, completed, attempts, best_solution,
        completed_at, time_spent
      FROM user_progress 
      WHERE user_id = ? AND exercise_id = ?
    `, [userId, exerciseId]);

    let progress: UserProgress;

    if (progressData) {
      progress = {
        userId,
        exerciseId: progressData.exercise_id,
        completed: progressData.completed === 1,
        attempts: progressData.attempts || 0,
        bestSolution: progressData.best_solution,
        completedAt: progressData.completed_at ? new Date(progressData.completed_at) : undefined,
        timeSpent: progressData.time_spent || 0
      };
    } else {
      // Return default progress if no record exists
      progress = {
        userId,
        exerciseId,
        completed: false,
        attempts: 0,
        timeSpent: 0
      };
    }

    const response: APIResponse<UserProgress> = {
      success: true,
      data: progress
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('❌ Progress API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/progress/:userId - Get user's progress for all exercises (MUST come after specific route!)
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const db = getDatabase();

    const progressData = await db.all(`
      SELECT 
        id, exercise_id, completed, attempts, best_solution,
        completed_at, time_spent, created_at, updated_at
      FROM user_progress 
      WHERE user_id = ?
      ORDER BY created_at ASC
    `, [userId]);

    const progress: UserProgress[] = progressData.map(p => ({
      userId,
      exerciseId: p.exercise_id,
      completed: p.completed === 1,
      attempts: p.attempts,
      bestSolution: p.best_solution,
      completedAt: p.completed_at ? new Date(p.completed_at) : undefined,
      timeSpent: p.time_spent
    }));

    const response: APIResponse<UserProgress[]> = {
      success: true,
      data: progress
    };

    res.json(response);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch progress', 500);
  }
});

// POST /api/progress/:userId/:exerciseId - Update exercise progress
router.post('/:userId/:exerciseId', async (req: Request, res: Response) => {
  try {
    const { userId, exerciseId } = req.params;
    const { completed, solution, timeSpent = 0 } = req.body;

    const db = getDatabase();

    // Get current progress
    const current = await db.get(`
      SELECT id, attempts, completed, time_spent
      FROM user_progress 
      WHERE user_id = ? AND exercise_id = ?
    `, [userId, exerciseId]);

    if (!current) {
      // Create new progress record
      const progressId = uuidv4();
      await db.run(`
        INSERT INTO user_progress 
        (id, user_id, exercise_id, completed, attempts, best_solution, completed_at, time_spent)
        VALUES (?, ?, ?, ?, 1, ?, ?, ?)
      `, [
        progressId,
        userId,
        exerciseId,
        completed ? 1 : 0,
        solution || null,
        completed ? new Date().toISOString() : null,
        timeSpent
      ]);
    } else {
      // Update existing progress
      const newAttempts = current.attempts + 1;
      const totalTimeSpent = current.time_spent + timeSpent;
      const isNewlyCompleted = completed && !current.completed;

      await db.run(`
        UPDATE user_progress 
        SET 
          completed = ?,
          attempts = ?,
          best_solution = COALESCE(?, best_solution),
          completed_at = CASE WHEN ? THEN ? ELSE completed_at END,
          time_spent = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND exercise_id = ?
      `, [
        completed ? 1 : current.completed,
        newAttempts,
        solution,
        isNewlyCompleted,
        isNewlyCompleted ? new Date().toISOString() : null,
        totalTimeSpent,
        userId,
        exerciseId
      ]);
    }

    // Return updated progress
    const updatedProgress = await db.get(`
      SELECT 
        exercise_id, completed, attempts, best_solution,
        completed_at, time_spent
      FROM user_progress 
      WHERE user_id = ? AND exercise_id = ?
    `, [userId, exerciseId]);

    const progress: UserProgress = {
      userId,
      exerciseId: updatedProgress.exercise_id,
      completed: updatedProgress.completed === 1,
      attempts: updatedProgress.attempts,
      bestSolution: updatedProgress.best_solution,
      completedAt: updatedProgress.completed_at ? new Date(updatedProgress.completed_at) : undefined,
      timeSpent: updatedProgress.time_spent
    };

    const response: APIResponse<UserProgress> = {
      success: true,
      data: progress,
      message: completed ? 'Exercise completed!' : 'Progress updated'
    };

    res.json(response);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to update progress', 500);
  }
});

export { router as progressRoutes };