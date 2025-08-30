import { Exercise } from '@portal/types';
import { ExerciseFiles } from '../types/metadata';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export class ExerciseValidator {
  /**
   * Validate a complete exercise
   */
  validateExercise(exercise: Exercise): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!exercise.id || typeof exercise.id !== 'string') {
      errors.push({ field: 'id', message: 'Exercise ID is required and must be a string' });
    }

    if (!exercise.title || typeof exercise.title !== 'string') {
      errors.push({ field: 'title', message: 'Exercise title is required and must be a string' });
    }

    if (!exercise.description || typeof exercise.description !== 'string') {
      errors.push({ field: 'description', message: 'Exercise description is required and must be a string' });
    }

    if (!exercise.instructions || typeof exercise.instructions !== 'string') {
      errors.push({ field: 'instructions', message: 'Exercise instructions are required and must be a string' });
    }

    if (!exercise.starterCode || typeof exercise.starterCode !== 'string') {
      errors.push({ field: 'starterCode', message: 'Starter code is required and must be a string' });
    }

    if (!exercise.testCode || typeof exercise.testCode !== 'string') {
      errors.push({ field: 'testCode', message: 'Test code is required and must be a string' });
    }

    // Difficulty validation
    const validDifficulties = ['beginner', 'intermediate', 'advanced'];
    if (!validDifficulties.includes(exercise.difficulty)) {
      errors.push({
        field: 'difficulty',
        message: `Difficulty must be one of: ${validDifficulties.join(', ')}`
      });
    }

    // Topics validation
    if (!Array.isArray(exercise.topics)) {
      errors.push({ field: 'topics', message: 'Topics must be an array' });
    } else if (exercise.topics.length === 0) {
      warnings.push('Exercise has no topics defined');
    }

    // Order validation
    if (typeof exercise.order !== 'number' || exercise.order < 1) {
      errors.push({ field: 'order', message: 'Order must be a positive number' });
    }

    // Estimated time validation
    if (typeof exercise.estimatedTime !== 'number' || exercise.estimatedTime < 1) {
      errors.push({ field: 'estimatedTime', message: 'Estimated time must be a positive number' });
    }

    // Content quality checks
    this.validateContent(exercise, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate exercise files before creating Exercise object
   */
  validateExerciseFiles(files: ExerciseFiles, folderName: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Required files validation
    if (!files.instructions) {
      errors.push({
        field: 'instructions',
        message: `Missing instructions.md file in ${folderName}`
      });
    }

    if (!files.starterCode) {
      errors.push({
        field: 'starterCode',
        message: `Missing starter.py file in ${folderName}`
      });
    }

    if (!files.testCode) {
      errors.push({
        field: 'testCode',
        message: `Missing test.py file in ${folderName}`
      });
    }

    // Optional solution warning
    if (!files.solutionCode) {
      warnings.push(`No solution file found for ${folderName}`);
    }

    // Content format validation
    if (files.instructions && !files.instructions.includes('#')) {
      warnings.push(`Instructions in ${folderName} may not be properly formatted (no headers found)`);
    }

    if (files.starterCode && !files.starterCode.includes('def ')) {
      warnings.push(`Starter code in ${folderName} may not contain function definitions`);
    }

    if (files.testCode && !files.testCode.includes('def ')) {
      warnings.push(`Test code in ${folderName} may not contain test functions`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate content quality
   */
  private validateContent(exercise: Exercise, errors: ValidationError[], warnings: string[]): void {
    // Instructions quality
    if (exercise.instructions.length < 50) {
      warnings.push('Instructions appear to be very short');
    }

    // Starter code quality
    if (exercise.starterCode.length < 10) {
      warnings.push('Starter code appears to be very minimal');
    }

    // Test code quality
    if (!exercise.testCode.includes('assert') && !exercise.testCode.includes('check')) {
      warnings.push('Test code may not contain proper assertions');
    }

    // Title and description consistency
    if (exercise.title.toLowerCase().includes('todo') ||
      exercise.description.toLowerCase().includes('todo')) {
      warnings.push('Title or description contains TODO markers');
    }

    // Estimated time reasonableness
    if (exercise.estimatedTime > 120) {
      warnings.push('Estimated time seems very high (>2 hours)');
    }
  }

  /**
   * Validate a batch of exercises
   */
  validateAll(exercises: Exercise[]): { [exerciseId: string]: ValidationResult } {
    const results: { [exerciseId: string]: ValidationResult } = {};

    exercises.forEach(exercise => {
      results[exercise.id] = this.validateExercise(exercise);
    });

    return results;
  }

  /**
   * Get validation summary
   */
  getValidationSummary(results: { [exerciseId: string]: ValidationResult }): {
    totalExercises: number;
    validExercises: number;
    invalidExercises: number;
    totalErrors: number;
    totalWarnings: number;
  } {
    const values = Object.values(results);

    return {
      totalExercises: values.length,
      validExercises: values.filter(r => r.isValid).length,
      invalidExercises: values.filter(r => !r.isValid).length,
      totalErrors: values.reduce((sum, r) => sum + r.errors.length, 0),
      totalWarnings: values.reduce((sum, r) => sum + r.warnings.length, 0)
    };
  }
}