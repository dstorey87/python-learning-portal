import { initializeDatabase, getDatabase } from '../database/init';
import { Exercise } from '@portal/types';
import { ExerciseLoader } from '@portal/exercises';



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

    // Load exercises using the new exercises package
    const loader = new ExerciseLoader();
    const exercises = await loader.loadAll();
    console.log(`📚 Loaded ${exercises.length} exercises from @portal/exercises package`);

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

export { saveExercisesToDatabase };