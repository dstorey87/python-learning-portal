import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Exercise } from '@portal/types';
import { EXERCISE_METADATA, ExerciseFiles, ExerciseMetadata } from '../types/metadata';

export class ExerciseLoader {
  private contentPath: string;

  constructor(contentPath?: string) {
    // Default to package content directory
    this.contentPath = contentPath || path.join(__dirname, '../../content');
  }

  /**
   * Load all exercises from the content directory
   */
  async loadAll(): Promise<Exercise[]> {
    const exercises: Exercise[] = [];

    if (!fs.existsSync(this.contentPath)) {
      throw new Error(`Exercises content directory not found: ${this.contentPath}`);
    }

    const exerciseFolders = fs.readdirSync(this.contentPath)
      .filter(folder => {
        const folderPath = path.join(this.contentPath, folder);
        return fs.statSync(folderPath).isDirectory() && folder.startsWith('E');
      })
      .sort(); // Sort to maintain order

    for (let i = 0; i < exerciseFolders.length; i++) {
      const folderName = exerciseFolders[i];
      if (!folderName) continue; // Skip if undefined

      try {
        const exercise = await this.loadExercise(folderName, i + 1);
        exercises.push(exercise);
        console.log(`✅ Loaded exercise: ${exercise.title}`);
      } catch (error) {
        console.error(`❌ Failed to load exercise ${folderName}:`, error);
      }
    }

    return exercises;
  }

  /**
   * Load a single exercise by folder name
   */
  async loadExercise(folderName: string, order: number): Promise<Exercise> {
    const folderPath = path.join(this.contentPath, folderName);

    if (!fs.existsSync(folderPath)) {
      throw new Error(`Exercise folder not found: ${folderPath}`);
    }

    const files = await this.loadExerciseFiles(folderPath);
    const metadata = this.getExerciseMetadata(folderName);

    const title = this.extractTitle(folderName);
    const description = this.extractDescription(files.instructions);

    const exercise: Exercise = {
      id: uuidv4(),
      title,
      description,
      instructions: files.instructions,
      starterCode: files.starterCode,
      testCode: files.testCode,
      solutionCode: files.solutionCode || '', // Default to empty string if no solution
      difficulty: metadata.difficulty,
      topics: metadata.topics,
      order,
      estimatedTime: metadata.estimatedTime
    };

    return exercise;
  }

  /**
   * Load exercise files from folder
   */
  private async loadExerciseFiles(folderPath: string): Promise<ExerciseFiles> {
    const instructionsPath = path.join(folderPath, 'instructions.md');
    const starterPath = path.join(folderPath, 'starter.py');
    const testPath = path.join(folderPath, 'test.py');

    // Look for solution in solutions directory within exercises package
    const solutionPath = path.join(this.contentPath, '../solutions', path.basename(folderPath), 'solution.py');

    return {
      instructions: this.readFileIfExists(instructionsPath),
      starterCode: this.readFileIfExists(starterPath),
      testCode: this.readFileIfExists(testPath),
      solutionCode: this.readFileIfExists(solutionPath) || undefined
    };
  }

  /**
   * Get metadata for an exercise
   */
  private getExerciseMetadata(folderName: string): ExerciseMetadata {
    return EXERCISE_METADATA[folderName] || {
      difficulty: 'intermediate',
      estimatedTime: 20,
      topics: ['general']
    };
  }

  /**
   * Extract title from folder name
   */
  private extractTitle(folderName: string): string {
    return folderName
      .replace(/^E\d+_/, '') // Remove E0_, E1_, etc.
      .replace(/_/g, ' ') // Replace underscores with spaces
      .replace(/\b\w/g, l => l.toUpperCase()); // Title case
  }

  /**
   * Extract description from instructions (first paragraph)
   */
  private extractDescription(instructions: string): string {
    const firstLine = instructions.split('\n').find(line => line.trim() && !line.startsWith('#'));
    return firstLine?.replace(/^#+\s*/, '') || 'Practice exercise';
  }

  /**
   * Read file content if it exists
   */
  private readFileIfExists(filePath: string): string {
    try {
      return fs.readFileSync(filePath, 'utf-8').trim();
    } catch (error) {
      console.warn(`⚠️  File not found: ${filePath}`);
      return '';
    }
  }

  /**
   * Get content path
   */
  getContentPath(): string {
    return this.contentPath;
  }

  /**
   * Set content path
   */
  setContentPath(contentPath: string): void {
    this.contentPath = contentPath;
  }
}