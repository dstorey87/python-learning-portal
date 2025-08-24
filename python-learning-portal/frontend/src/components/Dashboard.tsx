import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { Play, Trophy, Clock, BookOpen, Star, TrendingUp, Code, Zap, Target, Brain, Rocket, Award } from 'lucide-react'
import { exerciseApi } from '../api/exerciseApi'
import { useAppStore } from '../store/appStore'

export const Dashboard = () => {
  const navigate = useNavigate()
  const { user, userProgress } = useAppStore()

  const { data: exercises = [] } = useQuery(
    'exercises',
    exerciseApi.getAllExercises
  )

  const completedExercises = userProgress.filter(p => p.completed)
  const inProgressExercises = userProgress.filter(p => !p.completed && (p.attempts || 0) > 0)
  const nextExercise = exercises.find(e => !userProgress.some(p => p.exerciseId === e.id && p.completed))

  const stats = [
    {
      name: 'Completed',
      value: completedExercises.length,
      total: exercises.length,
      icon: Trophy,
      color: 'text-green-400 bg-green-500/20',
      gradient: 'from-green-500 to-emerald-600'
    },
    {
      name: 'In Progress', 
      value: inProgressExercises.length,
      total: exercises.length,
      icon: Clock,
      color: 'text-orange-400 bg-orange-500/20',
      gradient: 'from-orange-500 to-amber-600'
    },
    {
      name: 'Total Time',
      value: Math.round((userProgress.reduce((acc, p) => acc + p.timeSpent, 0) / 60) || 0),
      unit: 'min',
      icon: TrendingUp,
      color: 'text-blue-400 bg-blue-500/20',
      gradient: 'from-blue-500 to-cyan-600'
    },
    {
      name: 'Streak',
      value: 0, // TODO: Calculate streak
      unit: 'days',
      icon: Star,
      color: 'text-purple-400 bg-purple-500/20',
      gradient: 'from-purple-500 to-pink-600'
    }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section with Background */}
      <div className="relative mb-12">
        <div className="relative bg-gradient-to-r from-blue-900/90 via-purple-900/90 to-indigo-900/90 rounded-2xl overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-indigo-600/20"></div>
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
          
          <div className="relative px-8 py-12">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Code className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">
                  Welcome back, {user?.username || 'Learner'}!
                </h1>
                <p className="text-xl text-gray-200 flex items-center mt-2">
                  <Rocket className="h-5 w-5 mr-2" />
                  Continue your Python mastery journey
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-12">
        {stats.map((stat) => (
          <div key={stat.name} className="card hover-lift">
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-4 rounded-xl ${stat.color} relative overflow-hidden`}>
                <div className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} opacity-10`}></div>
                <stat.icon className="h-7 w-7 relative z-10" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">{stat.name}</p>
                <p className="text-3xl font-bold text-white">
                  {stat.value}
                  {stat.unit && <span className="text-base font-normal text-gray-400 ml-1">{stat.unit}</span>}
                  {stat.total && <span className="text-base font-normal text-gray-400">/{stat.total}</span>}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Continue Learning */}
        {nextExercise && (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Continue Learning</h2>
              <BookOpen className="h-6 w-6 text-blue-400" />
            </div>
            
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-xl p-6 mb-6 border border-blue-500/30">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-lg mb-2">{nextExercise.title}</h3>
                  <p className="text-sm text-gray-300 mb-4">{nextExercise.description}</p>
                </div>
                <div className="ml-4">
                  {nextExercise.difficulty === 'beginner' && <Target className="h-6 w-6 text-green-400" />}
                  {nextExercise.difficulty === 'intermediate' && <Brain className="h-6 w-6 text-yellow-400" />}
                  {nextExercise.difficulty === 'advanced' && <Zap className="h-6 w-6 text-red-400" />}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-xs">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    nextExercise.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    nextExercise.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                    'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {nextExercise.difficulty}
                  </span>
                  <span className="text-gray-400 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {nextExercise.estimatedTime} min
                  </span>
                </div>
                <button
                  onClick={() => navigate(`/exercise/${nextExercise.id}`)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Play className="h-4 w-4" />
                  <span>Start</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recent Progress */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Recent Progress</h2>
            <Award className="h-6 w-6 text-purple-400" />
          </div>
          
          {completedExercises.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8 text-gray-500" />
              </div>
              <p className="text-gray-400 text-lg mb-2">No completed exercises yet.</p>
              <p className="text-gray-500 text-sm">Start learning to see your progress!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedExercises.slice(0, 3).map((progress) => {
                const exercise = exercises.find(e => e.id === progress.exerciseId)
                if (!exercise) return null
                
                return (
                  <div
                    key={progress.exerciseId}
                    className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600/50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                        <Trophy className="h-4 w-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{exercise.title}</p>
                        <p className="text-xs text-gray-400">
                          Completed • {Math.round(progress.timeSpent / 60)} min
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/exercise/${exercise.id}`)}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                    >
                      Review
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* All Exercises Grid */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">All Exercises</h2>
          <div className="text-sm text-gray-400">
            {completedExercises.length} of {exercises.length} completed
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.map((exercise) => {
            const progress = userProgress.find(p => p.exerciseId === exercise.id)
            const isCompleted = progress?.completed
            const hasAttempts = (progress?.attempts || 0) > 0

            return (
              <div
                key={exercise.id}
                className={`
                  card-interactive cursor-pointer transition-all duration-300
                  ${isCompleted ? 'ring-2 ring-green-500/50 bg-green-500/10' : 
                    hasAttempts ? 'ring-2 ring-orange-500/50 bg-orange-500/10' : 
                    'hover:ring-2 hover:ring-blue-500/50'}
                `}
                onClick={() => navigate(`/exercise/${exercise.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-medium text-white text-sm">{exercise.title}</h3>
                  <div className="flex-shrink-0 ml-2">
                    {isCompleted ? (
                      <Trophy className="h-5 w-5 text-green-400" />
                    ) : hasAttempts ? (
                      <Clock className="h-5 w-5 text-orange-400" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-500" />
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-300 mb-3 line-clamp-2">
                  {exercise.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      exercise.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                      exercise.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                      'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {exercise.difficulty}
                    </span>
                    <span className="text-xs text-gray-400">{exercise.estimatedTime}min</span>
                  </div>

                  {progress && (progress.attempts || 0) > 0 && (
                    <span className="text-xs text-gray-400">
                      {progress.attempts} attempt{progress.attempts !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}