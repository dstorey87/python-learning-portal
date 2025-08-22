import { useQuery } from 'react-query'
import { Link, useLocation } from 'react-router-dom'
import { 
  Book, 
  Trophy, 
  Clock, 
  CheckCircle, 
  Code2, 
  Brain, 
  Zap, 
  Target, 
  GraduationCap,
  Play,
  Home
} from 'lucide-react'
import { exerciseApi } from '../api/exerciseApi'
import { useAppStore } from '../store/appStore'

export const Sidebar = () => {
  const location = useLocation()
  const { user, userProgress } = useAppStore()
  
  const { data: exercises = [], isLoading } = useQuery(
    'exercises',
    exerciseApi.getAllExercises,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  const getExerciseProgress = (exerciseId: string) => {
    return userProgress.find(p => p.exerciseId === exerciseId)
  }

  const isActiveExercise = (exerciseId: string) => {
    return location.pathname === `/exercise/${exerciseId}`
  }

  const isActiveRoute = (route: string) => {
    return location.pathname.startsWith(route)
  }

  const completedCount = userProgress.filter(p => p.completed).length
  const progressPercentage = exercises.length > 0 ? (completedCount / exercises.length) * 100 : 0

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return <Target className="h-3 w-3 text-green-400" />
      case 'intermediate': return <Brain className="h-3 w-3 text-yellow-400" />
      case 'advanced': return <Zap className="h-3 w-3 text-red-400" />
      default: return <Code2 className="h-3 w-3 text-blue-400" />
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-800 border-r border-gray-700">
      {/* Header with Hero Image */}
      <div className="p-6 border-b border-gray-700">
        <div className="relative mb-4">
          <div className="w-full h-32 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-xl overflow-hidden relative">
            {/* Hero Image Overlay */}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="text-center">
                <Code2 className="h-8 w-8 text-white mx-auto mb-2" />
                <h2 className="text-sm font-bold text-white">Master Python</h2>
                <p className="text-xs text-gray-200">Interactive Learning</p>
              </div>
            </div>
            <div className="absolute top-2 right-2">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <Trophy className="h-3 w-3 text-yellow-400" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Progress Summary */}
        <div className="bg-gray-700/50 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-300">Your Progress</span>
            <span className="text-sm font-bold text-blue-400">
              {completedCount}/{exercises.length}
            </span>
          </div>
          <div className="progress-bar mb-3">
            <div 
              className="progress-fill" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">{Math.round(progressPercentage)}% Complete</span>
            <div className="flex items-center text-yellow-400">
              <Trophy className="h-3 w-3 mr-1" />
              {completedCount} completed
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto">
        <div className="px-3 py-4">
          {/* Dashboard */}
          <Link
            to="/dashboard"
            className={`sidebar-item mb-2 ${
              location.pathname === '/dashboard' ? 'active' : ''
            }`}
          >
            <Home className="h-4 w-4 mr-3" />
            Dashboard
          </Link>

          {/* Learn Section */}
          <Link
            to="/learn"
            className={`sidebar-item mb-2 ${
              isActiveRoute('/learn') ? 'active' : ''
            }`}
          >
            <GraduationCap className="h-4 w-4 mr-3" />
            Learn
            <span className="ml-auto bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full">
              New
            </span>
          </Link>

          {/* Practice Section */}
          <Link
            to="/practice"
            className={`sidebar-item mb-6 ${
              isActiveRoute('/practice') ? 'active' : ''
            }`}
          >
            <Play className="h-4 w-4 mr-3" />
            Practice
          </Link>
        </div>

        {/* Exercise List - Only show when in exercise view */}
        {(isActiveRoute('/exercise') || location.pathname === '/dashboard') && (
          <div className="px-3 pb-4">
            <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Quick Access - Exercises
            </h3>
            
            {isLoading ? (
              <div className="px-4 py-2 text-sm text-gray-400 flex items-center">
                <div className="spinner mr-2"></div>
                Loading exercises...
              </div>
            ) : (
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {exercises.slice(0, 10).map((exercise) => {
                  const progress = getExerciseProgress(exercise.id)
                  const isActive = isActiveExercise(exercise.id)
                  
                  return (
                    <Link
                      key={exercise.id}
                      to={`/exercise/${exercise.id}`}
                      className={`
                        sidebar-item relative hover-lift text-xs
                        ${isActive ? 'active' : ''}
                      `}
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        <div className="flex-shrink-0 mr-2">
                          {progress?.completed ? (
                            <CheckCircle className="h-3 w-3 text-green-400" />
                          ) : (progress?.attempts || 0) > 0 ? (
                            <Clock className="h-3 w-3 text-orange-400" />
                          ) : (
                            <div className="h-3 w-3 rounded-full border-2 border-gray-500" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate text-gray-200">
                            {exercise.title.replace(/^E\d+_/, '').replace(/_/g, ' ')}
                          </div>
                          <div className="flex items-center text-xs text-gray-400">
                            {getDifficultyIcon(exercise.difficulty)}
                            <span className="ml-1">{exercise.estimatedTime}min</span>
                          </div>
                        </div>
                      </div>
                      
                      {(progress?.attempts || 0) > 0 && (
                        <div className="flex-shrink-0 ml-1">
                          <span className="inline-flex items-center px-1 py-0.5 rounded-full text-xs bg-gray-600 text-gray-200">
                            {progress?.attempts || 0}
                          </span>
                        </div>
                      )}
                    </Link>
                  )
                })}
                
                {exercises.length > 10 && (
                  <Link
                    to="/practice"
                    className="sidebar-item text-xs text-blue-400 hover:text-blue-300"
                  >
                    <Play className="h-3 w-3 mr-2" />
                    View all exercises...
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Footer - User Info */}
      {user && (
        <div className="p-4 border-t border-gray-700 bg-gray-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {(user.username || 'G')[0].toUpperCase()}
              </span>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-200">
                {user.username || 'Guest'}
              </div>
              <div className="text-xs text-gray-400">
                Python Learner
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}