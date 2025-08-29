import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  Code, 
  Calculator, 
  FileText, 
  GitBranch, 
  RotateCcw, 
  Layers, 
  Database, 
  Folder, 
  Package, 
  Bug,
  Filter,
  Search,
  Play,
  Trophy,
  Clock,
  ChevronRight,
  BookOpen
} from 'lucide-react'
import { exerciseApi } from '../../api/exerciseApi'
import { useAppStore } from '../../store/appStore'
import { Exercise } from '@portal/types'

// Exercise categories with their metadata
const EXERCISE_CATEGORIES = [
  {
    id: 'functions-strings',
    title: 'Functions & Strings',
    description: 'Basic function definition and string operations',
    icon: Code,
    color: 'from-blue-500 to-cyan-600',
    exercises: ['E0_greet']
  },
  {
    id: 'numbers-arithmetic',
    title: 'Numbers & Arithmetic',
    description: 'Mathematical operations and number handling',
    icon: Calculator,
    color: 'from-green-500 to-emerald-600',
    exercises: ['E1_seconds_to_hms', 'E1_tip_calc']
  },
  {
    id: 'string-processing',
    title: 'String Processing',
    description: 'Advanced string manipulation and text processing',
    icon: FileText,
    color: 'from-purple-500 to-pink-600',
    exercises: ['E2_initials', 'E2_username_slug']
  },
  {
    id: 'conditionals',
    title: 'Conditional Logic',
    description: 'Decision making with if/elif/else statements',
    icon: GitBranch,
    color: 'from-orange-500 to-amber-600',
    exercises: ['E3_grade_mapper', 'E3_leap_year']
  },
  {
    id: 'loops',
    title: 'Loops & Iteration',
    description: 'Repetitive operations with for and while loops',
    icon: RotateCcw,
    color: 'from-indigo-500 to-blue-600',
    exercises: ['E4_fizzbuzz', 'E4_prime_checker']
  },
  {
    id: 'advanced-functions',
    title: 'Advanced Functions',
    description: 'Complex function patterns and techniques',
    icon: Layers,
    color: 'from-teal-500 to-cyan-600',
    exercises: ['E5_math_utils', 'E5_password_strength', 'E5_temp_convert']
  },
  {
    id: 'collections',
    title: 'Collections & Data Structures',
    description: 'Lists, sets, dictionaries and data organization',
    icon: Database,
    color: 'from-rose-500 to-pink-600',
    exercises: ['E6_set_ops']
  },
  {
    id: 'file-operations',
    title: 'File Operations',
    description: 'Reading, writing and processing files',
    icon: Folder,
    color: 'from-yellow-500 to-orange-600',
    exercises: ['E7_sum_numbers']
  },
  {
    id: 'modules',
    title: 'Modules & Organization',
    description: 'Code organization and module systems',
    icon: Package,
    color: 'from-violet-500 to-purple-600',
    exercises: ['E8_ops_module']
  },
  {
    id: 'debugging',
    title: 'Debugging & Problem Solving',
    description: 'Troubleshooting and code analysis',
    icon: Bug,
    color: 'from-red-500 to-rose-600',
    exercises: ['E9_bug_hunt']
  }
]

export const PracticeSection: React.FC = () => {
  const navigate = useNavigate()
  const { categoryId } = useParams<{ categoryId?: string }>()
  const { userProgress } = useAppStore()
  const [searchTerm, setSearchTerm] = useState('')

  const { data: exercises = [] } = useQuery(
    'exercises',
    exerciseApi.getAllExercises
  )

  // Filter categories based on search
  const filteredCategories = EXERCISE_CATEGORIES.filter(category =>
    !searchTerm || 
    category.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // If a specific category is selected, show only that category
  const selectedCategory = categoryId 
    ? EXERCISE_CATEGORIES.find(cat => cat.id === categoryId)
    : null

  const getExerciseProgress = (exerciseId: string) => {
    return userProgress.find(p => p.exerciseId === exerciseId)
  }

  const getCategoryStats = (category: typeof EXERCISE_CATEGORIES[0]) => {
    // Create a mapping function to match exercises by their topics
    const isExerciseInCategory = (exercise: Exercise) => {
      if (!exercise.topics || !Array.isArray(exercise.topics)) return false;
      
      // Define topic mappings for each category
      const categoryTopicMap: { [key: string]: string[] } = {
        'functions-strings': ['functions', 'strings', 'basic-io'],
        'numbers-arithmetic': ['math', 'arithmetic', 'time-conversion', 'calculations'],
        'string-processing': ['strings', 'string-methods', 'text-processing', 'validation'],
        'conditionals': ['conditionals', 'if-statements', 'comparison-operators', 'logic', 'date-calculations'],
        'loops': ['loops', 'modulo-operator', 'algorithms', 'optimization'],
        'advanced-functions': ['functions', 'math', 'algorithms', 'problem-solving', 'conversions'],
        'collections': ['sets', 'data-structures', 'set-operations'],
        'file-operations': ['strings', 'parsing', 'error-handling'],
        'modules': ['modules', 'classes', 'oop', 'code-organization'],
        'debugging': ['debugging', 'error-handling', 'code-analysis', 'problem-solving']
      };

      const expectedTopics = categoryTopicMap[category.id] || [];
      return expectedTopics.some(topic => exercise.topics.includes(topic));
    };

    const categoryExercises = exercises.filter(isExerciseInCategory);
    const completed = categoryExercises.filter(ex => 
      getExerciseProgress(ex.id)?.completed
    ).length
    const inProgress = categoryExercises.filter(ex => {
      const progress = getExerciseProgress(ex.id)
      return !progress?.completed && (progress?.attempts || 0) > 0
    }).length

    return { total: categoryExercises.length, completed, inProgress }
  }

  if (selectedCategory) {
    // Show specific category details
    return <CategoryDetail category={selectedCategory} exercises={exercises} />
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Play className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Practice Exercises</h1>
            <p className="text-gray-300">Test your skills with hands-on coding challenges</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-gray-300 hover:bg-gray-600/50 transition-colors">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((category) => {
          const stats = getCategoryStats(category)
          const IconComponent = category.icon

          return (
            <div
              key={category.id}
              onClick={() => navigate(`/practice/${category.id}`)}
              className="card-interactive cursor-pointer group"
            >
              {/* Category Header */}
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${category.color} bg-opacity-20`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
              </div>

              {/* Category Info */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white mb-2">{category.title}</h3>
                <p className="text-sm text-gray-300">{category.description}</p>
              </div>

              {/* Progress Stats */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4 text-xs">
                  <span className="flex items-center text-green-400">
                    <Trophy className="h-3 w-3 mr-1" />
                    {stats.completed}
                  </span>
                  <span className="flex items-center text-orange-400">
                    <Clock className="h-3 w-3 mr-1" />
                    {stats.inProgress}
                  </span>
                  <span className="text-gray-400">
                    Total: {stats.total}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-700/50 rounded-full h-2">
                <div
                  className={`h-2 rounded-full bg-gradient-to-r ${category.color} transition-all duration-300`}
                  style={{ 
                    width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` 
                  }}
                ></div>
              </div>

              {/* Exercise Count */}
              <div className="mt-3 text-xs text-gray-400">
                {getCategoryStats(category).total} exercise{getCategoryStats(category).total !== 1 ? 's' : ''}
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Stats */}
      <div className="mt-12 card">
        <h2 className="text-xl font-semibold text-white mb-6">Your Progress Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {userProgress.filter(p => p.completed).length}
            </div>
            <div className="text-sm text-gray-300">Completed Exercises</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-400 mb-2">
              {userProgress.filter(p => !p.completed && (p.attempts || 0) > 0).length}
            </div>
            <div className="text-sm text-gray-300">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {Math.round(userProgress.reduce((acc, p) => acc + p.timeSpent, 0) / 60)}
            </div>
            <div className="text-sm text-gray-300">Minutes Practiced</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Category Detail Component
const CategoryDetail: React.FC<{
  category: typeof EXERCISE_CATEGORIES[0]
  exercises: Exercise[]
}> = ({ category, exercises }) => {
  const navigate = useNavigate()
  const { userProgress } = useAppStore()

  // Create a mapping function to match exercises by their topics
  const isExerciseInCategory = (exercise: Exercise) => {
    if (!exercise.topics || !Array.isArray(exercise.topics)) return false;
    
    // Define topic mappings for each category
    const categoryTopicMap: { [key: string]: string[] } = {
      'functions-strings': ['functions', 'strings', 'basic-io'],
      'numbers-arithmetic': ['math', 'arithmetic', 'time-conversion', 'calculations'],
      'string-processing': ['strings', 'string-methods', 'text-processing', 'validation'],
      'conditionals': ['conditionals', 'if-statements', 'comparison-operators', 'logic', 'date-calculations'],
      'loops': ['loops', 'modulo-operator', 'algorithms', 'optimization'],
      'advanced-functions': ['functions', 'math', 'algorithms', 'problem-solving', 'conversions'],
      'collections': ['sets', 'data-structures', 'set-operations'],
      'file-operations': ['strings', 'parsing', 'error-handling'],
      'modules': ['modules', 'classes', 'oop', 'code-organization'],
      'debugging': ['debugging', 'error-handling', 'code-analysis', 'problem-solving']
    };

    const expectedTopics = categoryTopicMap[category.id] || [];
    return expectedTopics.some(topic => exercise.topics.includes(topic));
  };

  const categoryExercises = exercises.filter(isExerciseInCategory);

  const getExerciseProgress = (exerciseId: string) => {
    return userProgress.find(p => p.exerciseId === exerciseId)
  }

  const IconComponent = category.icon

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/practice')}
          className="text-blue-400 hover:text-blue-300 text-sm mb-4 flex items-center"
        >
          ← Back to Practice
        </button>
        
        <div className="flex items-center space-x-4 mb-6">
          <div className={`p-4 rounded-xl bg-gradient-to-r ${category.color} bg-opacity-20`}>
            <IconComponent className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{category.title}</h1>
            <p className="text-gray-300">{category.description}</p>
          </div>
        </div>
      </div>

      {/* Exercises */}
      <div className="space-y-4">
        {categoryExercises.map((exercise) => {
          const progress = getExerciseProgress(exercise.id)
          const isCompleted = progress?.completed
          const hasAttempts = (progress?.attempts || 0) > 0

          return (
            <div
              key={exercise.id}
              onClick={() => navigate(`/exercise/${exercise.id}`)}
              className={`
                card-interactive cursor-pointer transition-all duration-300
                ${isCompleted ? 'ring-2 ring-green-500/50 bg-green-500/10' : 
                  hasAttempts ? 'ring-2 ring-orange-500/50 bg-orange-500/10' : 
                  'hover:ring-2 hover:ring-blue-500/50'}
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {isCompleted ? (
                      <Trophy className="h-6 w-6 text-green-400" />
                    ) : hasAttempts ? (
                      <Clock className="h-6 w-6 text-orange-400" />
                    ) : (
                      <BookOpen className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-lg">{exercise.title}</h3>
                    <p className="text-sm text-gray-300 mb-2">{exercise.description}</p>
                    
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        exercise.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        exercise.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {exercise.difficulty}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {exercise.estimatedTime} min
                      </span>
                      {progress && (progress.attempts || 0) > 0 && (
                        <span className="text-xs text-gray-400">
                          {progress.attempts} attempt{progress.attempts !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PracticeSection