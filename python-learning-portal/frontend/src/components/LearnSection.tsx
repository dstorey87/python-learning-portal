import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  BookOpen, 
  GraduationCap, 
  Target, 
  Users, 
  Clock, 
  Trophy,
  ArrowRight,
  CheckCircle,
  Circle
} from 'lucide-react'

// Chapter definitions
const CHAPTERS = [
  {
    id: 1,
    title: 'Functions & Basic String Operations',
    description: 'Learn to create reusable code blocks and manipulate text',
    topics: ['Function definition', 'Parameters and return values', 'f-strings', 'String methods'],
    exercises: ['E0_greet'],
    estimatedTime: 45,
    difficulty: 'beginner',
    isAvailable: true
  },
  {
    id: 2,
    title: 'Numbers & Arithmetic Operations',
    description: 'Master mathematical operations and number handling',
    topics: ['Integer and float operations', 'Mathematical operators', 'Number formatting', 'Type conversion'],
    exercises: ['E1_seconds_to_hms', 'E1_tip_calc'],
    estimatedTime: 60,
    difficulty: 'beginner',
    isAvailable: false // Will be unlocked after Chapter 1
  },
  {
    id: 3,
    title: 'Strings & Text Processing',
    description: 'Advanced string manipulation and text processing',
    topics: ['String splitting and joining', 'Text parsing', 'String validation', 'Regular expressions basics'],
    exercises: ['E2_initials', 'E2_username_slug'],
    estimatedTime: 75,
    difficulty: 'beginner',
    isAvailable: false
  },
  // More chapters to be added...
]

export const LearnSection: React.FC = () => {
  const navigate = useNavigate()
  const { chapterNumber } = useParams<{ chapterNumber?: string }>()

  // If specific chapter is requested, show chapter detail
  if (chapterNumber) {
    const chapter = CHAPTERS.find(c => c.id === parseInt(chapterNumber))
    if (chapter) {
      return <ChapterDetail chapter={chapter} />
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Learn Python</h1>
            <p className="text-gray-300">Comprehensive, beginner-friendly Python course</p>
          </div>
        </div>

        {/* Course Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card text-center">
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <BookOpen className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">Structured Learning</h3>
            <p className="text-sm text-gray-300">Follow a carefully designed curriculum that builds knowledge step by step</p>
          </div>
          
          <div className="card text-center">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Target className="h-6 w-6 text-green-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">Hands-On Practice</h3>
            <p className="text-sm text-gray-300">Learn by doing with guided exercises and real-world examples</p>
          </div>
          
          <div className="card text-center">
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">Beginner Friendly</h3>
            <p className="text-sm text-gray-300">No prior programming experience required - we start from the basics</p>
          </div>
        </div>
      </div>

      {/* Chapter Roadmap */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Learning Path</h2>
        <div className="space-y-4">
          {CHAPTERS.map((chapter) => (
            <ChapterCard 
              key={chapter.id} 
              chapter={chapter} 
              isLocked={!chapter.isAvailable}
              onSelect={() => chapter.isAvailable && navigate(`/learn/chapter/${chapter.id}`)}
            />
          ))}
        </div>
      </div>

      {/* Coming Soon */}
      <div className="card bg-gradient-to-r from-blue-500/10 to-purple-600/10 border border-blue-500/20">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">🚧 Under Development</h3>
          <p className="text-gray-300 mb-4">
            The Learn section is being built with comprehensive tutorials, examples, and guided practice.
          </p>
          <div className="text-sm text-gray-400 mb-6">
            For now, you can practice with the exercises in the Practice section!
          </div>
          <button
            onClick={() => navigate('/practice')}
            className="btn-primary"
          >
            Go to Practice Exercises
          </button>
        </div>
      </div>
    </div>
  )
}

// Chapter Card Component
const ChapterCard: React.FC<{
  chapter: typeof CHAPTERS[0]
  isLocked: boolean
  onSelect: () => void
}> = ({ chapter, isLocked, onSelect }) => {
  return (
    <div
      onClick={onSelect}
      className={`
        card-interactive transition-all duration-300
        ${isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:ring-2 hover:ring-blue-500/50'}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            chapter.isAvailable 
              ? 'bg-blue-500/20 text-blue-400' 
              : 'bg-gray-700/50 text-gray-500'
          }`}>
            {chapter.isAvailable ? (
              <CheckCircle className="h-6 w-6" />
            ) : (
              <Circle className="h-6 w-6" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-white">Chapter {chapter.id}: {chapter.title}</h3>
              {isLocked && (
                <span className="px-2 py-1 bg-gray-700/50 text-gray-400 text-xs rounded">
                  Locked
                </span>
              )}
            </div>
            <p className="text-sm text-gray-300 mb-2">{chapter.description}</p>
            
            <div className="flex items-center space-x-4 text-xs text-gray-400">
              <span className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {chapter.estimatedTime} min
              </span>
              <span className="flex items-center">
                <Trophy className="h-3 w-3 mr-1" />
                {chapter.exercises.length} exercise{chapter.exercises.length !== 1 ? 's' : ''}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                chapter.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                chapter.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {chapter.difficulty}
              </span>
            </div>
          </div>
        </div>

        {!isLocked && (
          <ArrowRight className="h-5 w-5 text-gray-400" />
        )}
      </div>
    </div>
  )
}

// Chapter Detail Component (placeholder)
const ChapterDetail: React.FC<{
  chapter: typeof CHAPTERS[0]
}> = ({ chapter }) => {
  const navigate = useNavigate()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate('/learn')}
        className="text-blue-400 hover:text-blue-300 text-sm mb-6 flex items-center"
      >
        ← Back to Learn
      </button>

      <div className="card">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Chapter {chapter.id}: {chapter.title}
          </h1>
          <p className="text-gray-300 mb-6">{chapter.description}</p>
          
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
            <p className="text-yellow-400 text-sm">
              🚧 This chapter content is currently being developed with comprehensive tutorials and examples.
            </p>
          </div>

          <button
            onClick={() => navigate('/practice')}
            className="btn-primary"
          >
            Practice Exercises Instead
          </button>
        </div>
      </div>
    </div>
  )
}