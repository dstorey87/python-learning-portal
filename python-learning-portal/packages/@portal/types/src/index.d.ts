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
    estimatedTime: number;
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
    timeSpent: number;
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
    revealLevel: number;
}
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
export interface ExerciseMetadata {
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    topics: string[];
    estimatedTime: number;
    order: number;
}
export declare class AppError extends Error {
    statusCode: number;
    code?: string | undefined;
    constructor(message: string, statusCode?: number, code?: string | undefined);
}
export declare class ValidationError extends AppError {
    field?: string | undefined;
    constructor(message: string, field?: string | undefined);
}
export declare class ExecutionError extends AppError {
    originalError?: Error | undefined;
    constructor(message: string, originalError?: Error | undefined);
}
export declare function isExercise(obj: unknown): obj is Exercise;
export declare function isTestResult(obj: unknown): obj is TestResult;
export declare function isAPIResponse<T>(obj: unknown): obj is APIResponse<T>;
export declare const DIFFICULTY_LEVELS: readonly ["beginner", "intermediate", "advanced"];
export declare const THEMES: readonly ["light", "dark"];
export declare const CONCEPT_CATEGORIES: readonly ["function", "operator", "keyword", "data-type", "method", "concept"];
export type DifficultyLevel = typeof DIFFICULTY_LEVELS[number];
export type Theme = typeof THEMES[number];
export type ConceptCategory = typeof CONCEPT_CATEGORIES[number];
//# sourceMappingURL=index.d.ts.map