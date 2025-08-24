import { Router, Request, Response } from 'express';
import { getDatabase } from '../database/init';
import { v4 as uuidv4 } from 'uuid';
import { APIResponse, User, AppError } from '../types';

const router = Router();

// GET /api/users/:id - Get user profile
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    const user = await db.get(`
      SELECT id, username, email, created_at
      FROM users 
      WHERE id = ?
    `, [id]);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Get user statistics
    const stats = await db.get(`
      SELECT 
        COUNT(CASE WHEN completed = 1 THEN 1 END) as total_completed,
        SUM(time_spent) as total_time_spent
      FROM user_progress 
      WHERE user_id = ?
    `, [id]);

    const userProfile: User = {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: new Date(user.created_at),
      totalExercisesCompleted: stats?.total_completed || 0,
      totalTimeSpent: stats?.total_time_spent || 0,
      currentStreak: 0, // TODO: Calculate streak
      longestStreak: 0  // TODO: Calculate streak
    };

    const response: APIResponse<User> = {
      success: true,
      data: userProfile
    };

    res.json(response);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch user', 500);
  }
});

// POST /api/users - Create or get user by username
router.post('/', async (req: Request, res: Response) => {
  try {
    const { username, email } = req.body;

    if (!username || typeof username !== 'string') {
      throw new AppError('Username is required', 400);
    }

    const db = getDatabase();
    
    // Check if user already exists
    const user = await db.get(
      'SELECT id, username, email, created_at FROM users WHERE username = ?',
      [username]
    );

    if (user) {
      // Return existing user
      const userProfile: User = {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: new Date(user.created_at),
        totalExercisesCompleted: 0,
        totalTimeSpent: 0,
        currentStreak: 0,
        longestStreak: 0
      };

      const response: APIResponse<User> = {
        success: true,
        data: userProfile,
        message: 'User already exists'
      };

      return res.json(response);
    }

    // Create new user
    const userId = uuidv4();
    await db.run(
      'INSERT INTO users (id, username, email) VALUES (?, ?, ?)',
      [userId, username, email || null]
    );

    const userProfile: User = {
      id: userId,
      username,
      email: email || undefined,
      createdAt: new Date(),
      totalExercisesCompleted: 0,
      totalTimeSpent: 0,
      currentStreak: 0,
      longestStreak: 0
    };

    const response: APIResponse<User> = {
      success: true,
      data: userProfile,
      message: 'User created successfully'
    };

    return res.status(201).json(response);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to create user', 500);
  }
});

export { router as userRoutes };