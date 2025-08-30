export interface ExerciseMetadata {
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  topics: string[];
}

export interface ExerciseFiles {
  instructions: string;
  starterCode: string;
  testCode: string;
  solutionCode?: string;
}

export interface ExerciseConfig extends ExerciseMetadata {
  id: string;
  title: string;
  description: string;
  order: number;
}

export const EXERCISE_METADATA: Record<string, ExerciseMetadata> = {
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