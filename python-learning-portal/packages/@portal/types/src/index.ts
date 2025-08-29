// =============================================================================
// CORE DOMAIN TYPES
// =============================================================================

export interface Exercise {
  id: string;
  title: string;
  description: string;
  instructions: string;
  starterCode: string;
  testCode: string;
  solutionCode: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  topics: string[];
  order: number;
  estimatedTime: number; // in minutes
}

export interface TestResult {
  passed: boolean;
  output: string;
  errors?: string;
  executionTime: number;
  testCases: TestCase[];
}

export interface TestCase {
  name: string;
  passed: boolean;
  expected?: unknown;
  actual?: unknown;
  error?: string;
}

export interface UserProgress {
  userId: string;
  exerciseId: string;
  completed: boolean;
  attempts: number;
  bestSolution?: string;
  completedAt?: Date;
  timeSpent: number; // in seconds
}

export interface User {
  id: string;
  username: string;
  email?: string;
  createdAt: Date;
  totalExercisesCompleted: number;
  totalTimeSpent: number;
  currentStreak: number;
  longestStreak: number;
}

export interface Session {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  exercisesWorkedOn: string[];
  totalTimeSpent: number;
}

export interface Hint {
  id: string;
  exerciseId: string;
  title: string;
  content: string;
  order: number;
  revealLevel: number; // 1 = basic hint, 2 = more detailed, 3 = solution approach
}

// =============================================================================
// EXECUTION & API TYPES
// =============================================================================

export interface CodeExecution {
  code: string;
  exerciseId: string;
  runTests: boolean;
}

export interface CodeExecutionResult {
  success: boolean;
  output: string;
  errors?: string;
  testResult?: TestResult;
  executionTime: number;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// =============================================================================
// FRONTEND-SPECIFIC TYPES
// =============================================================================

export interface UIState {
  currentExercise: Exercise | null;
  userCode: string;
  isRunning: boolean;
  showSolution: boolean;
  showHints: boolean;
  testResults: TestResult | null;
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
}

export interface EditorSettings {
  fontSize: number;
  theme: string;
  wordWrap: boolean;
  minimap: boolean;
  autoSave: boolean;
}

export interface TerminalRef {
  addOutput: (output: string) => void;
  addError: (error: string) => void;
  clear: () => void;
  setRunning: (running: boolean) => void;
}

export interface Concept {
  id: string;
  name: string;
  category: 'function' | 'operator' | 'keyword' | 'data-type' | 'method' | 'concept';
  description: string;
  simpleExample: string;
  syntax?: string;
  parameters?: string[];
  relatedConcepts?: string[];
}

// =============================================================================
// DATABASE TYPES (Backend-specific)
// =============================================================================

export interface DatabaseUser {
  id: string;
  username: string;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseProgress {
  id: string;
  user_id: string;
  exercise_id: string;
  completed: boolean;
  attempts: number;
  best_solution: string | null;
  completed_at: string | null;
  time_spent: number;
  created_at: string;
  updated_at: string;
}

export interface DatabaseSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  exercises_worked_on: string;
  total_time_spent: number;
  created_at: string;
}

// =============================================================================
// EXERCISE METADATA TYPES
// =============================================================================

export interface ExerciseMetadata {
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  topics: string[];
  estimatedTime: number;
  order: number;
}

// =============================================================================
// ERROR TYPES
// =============================================================================

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class ExecutionError extends AppError {
  constructor(message: string, public originalError?: Error) {
    super(message, 500, 'EXECUTION_ERROR');
    this.name = 'ExecutionError';
  }
}

// =============================================================================
// TYPE GUARDS & UTILITIES
// =============================================================================

export function isExercise(obj: unknown): obj is Exercise {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'title' in obj &&
    'starterCode' in obj &&
    typeof (obj as Exercise).id === 'string'
  );
}

export function isTestResult(obj: unknown): obj is TestResult {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'passed' in obj &&
    'output' in obj &&
    'testCases' in obj &&
    typeof (obj as TestResult).passed === 'boolean'
  );
}

export function isAPIResponse<T>(obj: unknown): obj is APIResponse<T> {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'success' in obj &&
    typeof (obj as APIResponse).success === 'boolean'
  );
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export const THEMES = ['light', 'dark'] as const;
export const CONCEPT_CATEGORIES = ['function', 'operator', 'keyword', 'data-type', 'method', 'concept'] as const;

export type DifficultyLevel = typeof DIFFICULTY_LEVELS[number];
export type Theme = typeof THEMES[number];
export type ConceptCategory = typeof CONCEPT_CATEGORIES[number];