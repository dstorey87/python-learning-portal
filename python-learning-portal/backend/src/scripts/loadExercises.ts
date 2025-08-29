import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { initializeDatabase, getDatabase } from '../database/init';
import { Exercise } from '../types';

// Configuration - point to the actual exercises directory
// Use environment-specific path: Docker container vs local development
const EXERCISES_ROOT = process.env.NODE_ENV === 'production' || process.cwd().includes('/app/')
  ? '/app/exercises'  // Docker container path
  : 'C:\\Users\\darre\\Downloads\\python_foundations_exercises\\python_foundations_exercises\\exercises'; // Local development path

interface ExerciseMetadata {
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  topics: string[];
}

// Map exercise folders to metadata
const exerciseMetadata: Record<string, ExerciseMetadata> = {
  'E0_greet': {
    difficulty: 'beginner',
    estimatedTime: 10,
    topics: ['functions', 'strings', 'basic-io']
  },
  'E1_seconds_to_hms': {
    difficulty: 'beginner',
    estimatedTime: 15,
    topics: ['math', 'arithmetic', 'time-conversion']
  },
  'E1_tip_calc': {
    difficulty: 'beginner',
    estimatedTime: 10,
    topics: ['math', 'arithmetic', 'calculations']
  },
  'E2_initials': {
    difficulty: 'beginner',
    estimatedTime: 12,
    topics: ['strings', 'string-methods', 'text-processing']
  },
  'E2_username_slug': {
    difficulty: 'beginner',
    estimatedTime: 15,
    topics: ['strings', 'string-methods', 'text-processing', 'validation']
  },
  'E3_grade_mapper': {
    difficulty: 'intermediate',
    estimatedTime: 20,
    topics: ['conditionals', 'if-statements', 'comparison-operators']
  },
  'E3_leap_year': {
    difficulty: 'intermediate',
    estimatedTime: 18,
    topics: ['conditionals', 'logic', 'date-calculations']
  },
  'E4_fizzbuzz': {
    difficulty: 'intermediate',
    estimatedTime: 25,
    topics: ['loops', 'conditionals', 'modulo-operator', 'algorithms']
  },
  'E4_prime_checker': {
    difficulty: 'intermediate',
    estimatedTime: 30,
    topics: ['loops', 'math', 'algorithms', 'optimization']
  },
  'E5_math_utils': {
    difficulty: 'intermediate',
    estimatedTime: 35,
    topics: ['functions', 'math', 'algorithms', 'problem-solving']
  },
  'E5_password_strength': {
    difficulty: 'intermediate',
    estimatedTime: 25,
    topics: ['strings', 'validation', 'conditionals', 'security']
  },
  'E5_temp_convert': {
    difficulty: 'intermediate',
    estimatedTime: 20,
    topics: ['functions', 'math', 'conversions', 'problem-solving']
  },
  'E6_set_ops': {
    difficulty: 'advanced',
    estimatedTime: 40,
    topics: ['sets', 'data-structures', 'set-operations', 'algorithms']
  },
  'E7_sum_numbers': {
    difficulty: 'advanced',
    estimatedTime: 30,
    topics: ['strings', 'parsing', 'error-handling', 'validation']
  },
  'E8_ops_module': {
    difficulty: 'advanced',
    estimatedTime: 45,
    topics: ['modules', 'classes', 'oop', 'code-organization']
  },
  'E9_bug_hunt': {
    difficulty: 'advanced',
    estimatedTime: 35,
    topics: ['debugging', 'error-handling', 'code-analysis', 'problem-solving']
  }
};

function extractTitle(folderName: string): string {
  // Convert E1_tip_calc to "Tip Calculator"
  const name = folderName.split('_').slice(1).join(' ');
  return name.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}

function readFileIfExists(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.warn(`File not found: ${filePath}`);
    return '';
  }
}

async function loadExercisesFromFilesystem(): Promise<Exercise[]> {
  const exercises: Exercise[] = [];
  
  if (!fs.existsSync(EXERCISES_ROOT)) {
    throw new Error(`Exercises directory not found: ${EXERCISES_ROOT}`);
  }

  const exerciseFolders = fs.readdirSync(EXERCISES_ROOT)
    .filter(folder => fs.statSync(path.join(EXERCISES_ROOT, folder)).isDirectory())
    .sort(); // Sort to maintain order

  for (let i = 0; i < exerciseFolders.length; i++) {
    const folderName = exerciseFolders[i];
    const folderPath = path.join(EXERCISES_ROOT, folderName);
    
    const instructionsPath = path.join(folderPath, 'instructions.md');
    const starterPath = path.join(folderPath, 'starter.py');
    const testPath = path.join(folderPath, 'test.py');
    
    // Read solution from solutions directory
    const solutionPath = path.join(EXERCISES_ROOT, '../solutions', folderName, 'solution.py');
    
    const instructions = readFileIfExists(instructionsPath);
    const starterCode = readFileIfExists(starterPath);
    const testCode = readFileIfExists(testPath);
    const solutionCode = readFileIfExists(solutionPath);
    
    const metadata = exerciseMetadata[folderName] || {
      difficulty: 'intermediate',
      estimatedTime: 20,
      topics: ['general']
    };
    
    // Extract description from instructions (first paragraph)
    const description = instructions.split('\n\n')[0] || `Practice ${extractTitle(folderName)}`;
    
    const exercise: Exercise = {
      id: uuidv4(),
      title: extractTitle(folderName),
      description: description.replace(/^#+\s*/, ''), // Remove markdown headers
      instructions,
      starterCode,
      testCode,
      solutionCode,
      difficulty: metadata.difficulty,
      topics: metadata.topics,
      order: i + 1,
      estimatedTime: metadata.estimatedTime
    };
    
    exercises.push(exercise);
    console.log(`Loaded exercise: ${exercise.title}`);
  }
  
  return exercises;
}

async function saveExercisesToDatabase(exercises: Exercise[]): Promise<void> {
  const db = getDatabase();
  
  console.log('Clearing existing exercises...');
  await db.run('DELETE FROM exercises');
  
  console.log('Inserting new exercises...');
  
  for (const exercise of exercises) {
    await db.run(`
      INSERT INTO exercises (
        id, title, description, instructions, starter_code, test_code, solution_code,
        difficulty, topics, order_index, estimated_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      exercise.id,
      exercise.title,
      exercise.description,
      exercise.instructions,
      exercise.starterCode,
      exercise.testCode,
      exercise.solutionCode,
      exercise.difficulty,
      JSON.stringify(exercise.topics),
      exercise.order,
      exercise.estimatedTime
    ]);
    
    console.log(`Saved exercise: ${exercise.title}`);
  }
}

async function main(): Promise<void> {
  try {
    console.log('🚀 Starting exercise data loading...');
    
    // Initialize database
    await initializeDatabase();
    console.log('✅ Database initialized');
    
    // Load exercises from filesystem
    const exercises = await loadExercisesFromFilesystem();
    console.log(`📚 Loaded ${exercises.length} exercises from filesystem`);
    
    // Save to database
    await saveExercisesToDatabase(exercises);
    console.log('✅ All exercises saved to database');
    
    console.log('🎉 Exercise loading completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error loading exercises:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { loadExercisesFromFilesystem, saveExercisesToDatabase };