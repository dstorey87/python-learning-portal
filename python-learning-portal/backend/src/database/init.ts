import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database<sqlite3.Database, sqlite3.Statement> | null = null;

export async function initializeDatabase(): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
  if (db) {
    return db;
  }

  const dbPath = path.join(__dirname, '../../data/database.sqlite');
  console.log('🔍 Attempting to open database at:', dbPath);
  console.log('🔍 Resolved path:', path.resolve(dbPath));
  
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    console.log('✅ Database opened successfully');
  } catch (error) {
    console.error('❌ Failed to open database:', error);
    throw error;
  }

  // Enable foreign keys
  await db.exec('PRAGMA foreign_keys = ON');

  // Create tables
  await createTables();

  console.log('Database initialized successfully');
  return db;
}

async function createTables(): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  // Users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Exercises table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      instructions TEXT NOT NULL,
      starter_code TEXT NOT NULL,
      test_code TEXT NOT NULL,
      solution_code TEXT NOT NULL,
      difficulty TEXT CHECK(difficulty IN ('beginner', 'intermediate', 'advanced')) NOT NULL,
      topics TEXT NOT NULL, -- JSON array as string
      order_index INTEGER NOT NULL,
      estimated_time INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // User progress table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      completed BOOLEAN DEFAULT FALSE,
      attempts INTEGER DEFAULT 0,
      best_solution TEXT,
      completed_at DATETIME,
      time_spent INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE,
      UNIQUE(user_id, exercise_id)
    )
  `);

  // Sessions table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME,
      exercises_worked_on TEXT, -- JSON array as string
      total_time_spent INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Hints table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS hints (
      id TEXT PRIMARY KEY,
      exercise_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      reveal_level INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better performance
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_progress_exercise_id ON user_progress(exercise_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_hints_exercise_id ON hints(exercise_id);
    CREATE INDEX IF NOT EXISTS idx_exercises_difficulty ON exercises(difficulty);
    CREATE INDEX IF NOT EXISTS idx_exercises_order ON exercises(order_index);
  `);

  console.log('Database tables created successfully');
}

export function getDatabase(): Database<sqlite3.Database, sqlite3.Statement> {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return db;
}

// Graceful shutdown
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
    console.log('Database connection closed');
  }
}