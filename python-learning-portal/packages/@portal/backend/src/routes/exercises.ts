import { Router, Request, Response } from 'express';
import { getDatabase } from '../database/init';
import { Exercise, APIResponse, AppError } from '../types';

const router = Router();

// GET /api/exercises - Get all exercises
router.get('/', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();

    const exercises = await db.all(`
      SELECT 
        id, title, description, instructions, starter_code, test_code, solution_code,
        difficulty, topics, order_index, estimated_time, created_at, updated_at
      FROM exercises 
      ORDER BY order_index ASC
    `);

    // Parse JSON fields
    const parsedExercises: Exercise[] = exercises.map(exercise => ({
      id: exercise.id,
      title: exercise.title,
      description: exercise.description,
      instructions: exercise.instructions,
      starterCode: exercise.starter_code,
      testCode: exercise.test_code,
      solutionCode: exercise.solution_code,
      difficulty: exercise.difficulty as 'beginner' | 'intermediate' | 'advanced',
      topics: JSON.parse(exercise.topics || '[]'),
      order: exercise.order_index,
      estimatedTime: exercise.estimated_time
    }));

    const response: APIResponse<Exercise[]> = {
      success: true,
      data: parsedExercises
    };

    res.json(response);
  } catch (error) {
    throw new AppError('Failed to fetch exercises', 500);
  }
});

// GET /api/exercises/:id - Get specific exercise
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const exercise = await db.get(`
      SELECT 
        id, title, description, instructions, starter_code, test_code, solution_code,
        difficulty, topics, order_index, estimated_time, created_at, updated_at
      FROM exercises 
      WHERE id = ?
    `, [id]);

    if (!exercise) {
      throw new AppError('Exercise not found', 404);
    }

    const parsedExercise: Exercise = {
      id: exercise.id,
      title: exercise.title,
      description: exercise.description,
      instructions: exercise.instructions,
      starterCode: exercise.starter_code,
      testCode: exercise.test_code,
      solutionCode: exercise.solution_code,
      difficulty: exercise.difficulty as 'beginner' | 'intermediate' | 'advanced',
      topics: JSON.parse(exercise.topics || '[]'),
      order: exercise.order_index,
      estimatedTime: exercise.estimated_time
    };

    const response: APIResponse<Exercise> = {
      success: true,
      data: parsedExercise
    };

    res.json(response);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch exercise', 500);
  }
});

// GET /api/exercises/:id/hints - Get hints for an exercise
router.get('/:id/hints', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const hints = await db.all(`
      SELECT id, title, content, order_index, reveal_level
      FROM hints 
      WHERE exercise_id = ?
      ORDER BY order_index ASC
    `, [id]);

    const response: APIResponse = {
      success: true,
      data: hints
    };

    res.json(response);
  } catch (error) {
    throw new AppError('Failed to fetch hints', 500);
  }
});

export { router as exerciseRoutes };