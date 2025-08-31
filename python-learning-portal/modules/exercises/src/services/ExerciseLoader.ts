/**
 * Exercise Loader Service
 * 
 * Loads exercises from file system and populates database
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface ExerciseData {
    id: string;
    title: string;
    description: string;
    instructions: string;
    starterCode: string;
    testCode: string;
    solutionCode?: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    category: string;
    concepts: string[];
    hints: string[];
    orderIndex: number;
}

export class ExerciseLoader {
    private db: any;

    constructor() {
        // Database will be injected via core services
    }

    /**
     * Load exercises from directory structure
     */
    async loadExercisesFromDirectory(exercisesPath: string): Promise<void> {
        try {
            this.db = (global as any).coreServices?.database;
            if (!this.db) {
                console.error('Database not available in core services');
                return;
            }

            console.log(`📚 Loading exercises from ${exercisesPath}...`);

            const entries = await fs.readdir(exercisesPath, { withFileTypes: true });
            const exerciseDirs = entries.filter(entry => entry.isDirectory());

            let loadedCount = 0;

            for (const dir of exerciseDirs) {
                try {
                    const exerciseData = await this.loadExerciseFromDirectory(
                        path.join(exercisesPath, dir.name),
                        dir.name
                    );

                    if (exerciseData) {
                        await this.saveExerciseToDatabase(exerciseData);
                        loadedCount++;
                    }
                } catch (error) {
                    console.error(`❌ Failed to load exercise ${dir.name}:`, error);
                }
            }

            console.log(`✅ Successfully loaded ${loadedCount} exercises`);
        } catch (error) {
            console.error('❌ Failed to load exercises:', error);
        }
    }

    /**
     * Load single exercise from directory
     */
    private async loadExerciseFromDirectory(exerciseDir: string, exerciseId: string): Promise<ExerciseData | null> {
        try {
            // Read required files
            const instructionsPath = path.join(exerciseDir, 'instructions.md');
            const starterPath = path.join(exerciseDir, 'starter.py');
            const testPath = path.join(exerciseDir, 'test.py');

            // Check if required files exist
            const filesExist = await Promise.all([
                this.fileExists(instructionsPath),
                this.fileExists(starterPath),
                this.fileExists(testPath)
            ]);

            if (!filesExist.every(exists => exists)) {
                console.warn(`⚠️  Skipping ${exerciseId}: missing required files`);
                return null;
            }

            // Read file contents
            const [instructions, starterCode, testCode] = await Promise.all([
                fs.readFile(instructionsPath, 'utf-8'),
                fs.readFile(starterPath, 'utf-8'),
                fs.readFile(testPath, 'utf-8')
            ]);

            // Try to read solution if it exists
            let solutionCode: string | undefined;
            const solutionPath = path.join(exerciseDir, '../solutions', exerciseId, 'solution.py');
            if (await this.fileExists(solutionPath)) {
                solutionCode = await fs.readFile(solutionPath, 'utf-8');
            }

            // Parse exercise metadata from instructions
            const metadata = this.parseExerciseMetadata(instructions, exerciseId);

            return {
                id: exerciseId,
                title: metadata.title,
                description: metadata.description,
                instructions: instructions,
                starterCode,
                testCode,
                solutionCode,
                difficulty: metadata.difficulty,
                category: metadata.category,
                concepts: metadata.concepts,
                hints: metadata.hints,
                orderIndex: metadata.orderIndex
            };
        } catch (error) {
            console.error(`Error loading exercise ${exerciseId}:`, error);
            return null;
        }
    }

    /**
     * Parse metadata from instructions markdown
     */
    private parseExerciseMetadata(instructions: string, exerciseId: string): {
        title: string;
        description: string;
        difficulty: 'beginner' | 'intermediate' | 'advanced';
        category: string;
        concepts: string[];
        hints: string[];
        orderIndex: number;
    } {
        // Extract title (first # heading)
        const titleMatch = instructions.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1].trim() : this.generateTitleFromId(exerciseId);

        // Extract description (first paragraph after title)
        const lines = instructions.split('\n');
        let description = '';
        let foundTitle = false;

        for (const line of lines) {
            if (line.startsWith('# ')) {
                foundTitle = true;
                continue;
            }

            if (foundTitle && line.trim() && !line.startsWith('#')) {
                description = line.trim();
                break;
            }
        }

        // Determine difficulty from exercise ID prefix
        let difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
        if (exerciseId.match(/^E[0-3]_/)) {
            difficulty = 'beginner';
        } else if (exerciseId.match(/^E[4-6]_/)) {
            difficulty = 'intermediate';
        } else if (exerciseId.match(/^E[7-9]_/)) {
            difficulty = 'advanced';
        }

        // Determine category from exercise content
        const category = this.categorizeExercise(instructions, exerciseId);

        // Extract concepts and hints from instructions
        const concepts = this.extractConcepts(instructions);
        const hints = this.extractHints(instructions);

        // Extract order from exercise ID
        const orderMatch = exerciseId.match(/^E(\d+)_/);
        const orderIndex = orderMatch ? parseInt(orderMatch[1]) : 999;

        return {
            title,
            description: description || `Practice exercise: ${title}`,
            difficulty,
            category,
            concepts,
            hints,
            orderIndex
        };
    }

    /**
     * Generate title from exercise ID
     */
    private generateTitleFromId(exerciseId: string): string {
        // Convert "E1_tip_calc" to "Tip Calculator"
        const parts = exerciseId.replace(/^E\d+_/, '').split('_');
        return parts.map(part =>
            part.charAt(0).toUpperCase() + part.slice(1)
        ).join(' ');
    }

    /**
     * Categorize exercise based on content
     */
    private categorizeExercise(instructions: string, exerciseId: string): string {
        const content = instructions.toLowerCase();

        if (content.includes('function') || content.includes('def ')) {
            return 'Functions';
        } else if (content.includes('loop') || content.includes('for ') || content.includes('while ')) {
            return 'Loops';
        } else if (content.includes('condition') || content.includes('if ')) {
            return 'Conditionals';
        } else if (content.includes('list') || content.includes('array')) {
            return 'Data Structures';
        } else if (content.includes('string') || content.includes('text')) {
            return 'Strings';
        } else if (content.includes('class') || content.includes('object')) {
            return 'Object-Oriented';
        } else if (content.includes('file') || content.includes('import')) {
            return 'File I/O';
        } else {
            return 'Basics';
        }
    }

    /**
     * Extract programming concepts from instructions
     */
    private extractConcepts(instructions: string): string[] {
        const concepts: string[] = [];
        const content = instructions.toLowerCase();

        // Common Python concepts to look for
        const conceptMap = {
            'variables': ['variable', 'assign'],
            'functions': ['function', 'def', 'return'],
            'loops': ['loop', 'for', 'while', 'iterate'],
            'conditionals': ['if', 'else', 'elif', 'condition'],
            'strings': ['string', 'text', 'str'],
            'lists': ['list', 'array', 'append'],
            'dictionaries': ['dict', 'dictionary', 'key'],
            'input/output': ['input', 'print', 'output'],
            'math': ['math', 'calculate', 'number'],
            'boolean logic': ['true', 'false', 'boolean', 'and', 'or'],
        };

        for (const [concept, keywords] of Object.entries(conceptMap)) {
            if (keywords.some(keyword => content.includes(keyword))) {
                concepts.push(concept);
            }
        }

        return concepts;
    }

    /**
     * Extract hints from instructions
     */
    private extractHints(instructions: string): string[] {
        const hints: string[] = [];

        // Look for hint sections
        const hintMatches = instructions.match(/(?:hint|tip|help):\s*(.+)/gi);
        if (hintMatches) {
            hints.push(...hintMatches.map(match =>
                match.replace(/^(?:hint|tip|help):\s*/i, '').trim()
            ));
        }

        // Add generic hints based on content
        const content = instructions.toLowerCase();

        if (content.includes('function')) {
            hints.push('Remember to use the def keyword to define a function');
        }

        if (content.includes('return')) {
            hints.push('Don\'t forget to return the result from your function');
        }

        if (content.includes('input')) {
            hints.push('Use input() to get user input, but remember it returns a string');
        }

        return hints;
    }

    /**
     * Save exercise to database
     */
    private async saveExerciseToDatabase(exercise: ExerciseData): Promise<void> {
        try {
            await this.db.run(`
        INSERT OR REPLACE INTO exercises (
          id, title, description, instructions, starter_code, test_code, solution_code,
          difficulty, category, concepts, hints, order_index, is_active,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
                exercise.id,
                exercise.title,
                exercise.description,
                exercise.instructions,
                exercise.starterCode,
                exercise.testCode,
                exercise.solutionCode,
                exercise.difficulty,
                exercise.category,
                JSON.stringify(exercise.concepts),
                JSON.stringify(exercise.hints),
                exercise.orderIndex,
                1 // is_active
            ]);

            console.log(`✅ Loaded exercise: ${exercise.id} - ${exercise.title}`);
        } catch (error) {
            console.error(`❌ Failed to save exercise ${exercise.id}:`, error);
        }
    }

    /**
     * Check if file exists
     */
    private async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
}

// Export singleton instance
const exerciseLoader = new ExerciseLoader();

/**
 * Load exercises from directory (used in module initialization)
 */
export async function loadExercisesFromDirectory(exercisesPath: string): Promise<void> {
    return exerciseLoader.loadExercisesFromDirectory(exercisesPath);
}