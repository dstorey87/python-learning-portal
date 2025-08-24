import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle, Circle, Lock, ArrowRight, Clock, Target, Lightbulb } from 'lucide-react';

interface Chapter {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  completed: boolean;
  locked: boolean;
  concepts: string[];
  practiceExercises: number;
}

const mockChapters: Chapter[] = [
  {
    id: 'ch1-basics',
    title: 'Python Basics & Your First Program',
    description: 'Start your Python journey! Learn what Python is, write your first program, and understand variables.',
    estimatedTime: '45 min',
    difficulty: 'Beginner',
    completed: false,
    locked: false,
    concepts: ['What is Python?', 'Writing your first program', 'Variables and values', 'Print statements'],
    practiceExercises: 2
  },
  {
    id: 'ch2-data-types',
    title: 'Understanding Data Types',
    description: 'Explore different types of data in Python: numbers, text, and how to work with them.',
    estimatedTime: '60 min',
    difficulty: 'Beginner',
    completed: false,
    locked: true,
    concepts: ['Numbers (integers, floats)', 'Strings (text)', 'Type conversion', 'Input from users'],
    practiceExercises: 3
  },
  {
    id: 'ch3-conditionals',
    title: 'Making Decisions with If Statements',
    description: 'Learn how to make your programs smart by teaching them to make decisions.',
    estimatedTime: '75 min',
    difficulty: 'Beginner',
    completed: false,
    locked: true,
    concepts: ['Boolean values (True/False)', 'Comparison operators', 'If, elif, else', 'Logical operators'],
    practiceExercises: 2
  },
  {
    id: 'ch4-loops',
    title: 'Repeating Tasks with Loops',
    description: 'Discover how to make your programs repeat tasks efficiently without copying code.',
    estimatedTime: '90 min',
    difficulty: 'Beginner',
    completed: false,
    locked: true,
    concepts: ['For loops', 'While loops', 'Range function', 'Break and continue'],
    practiceExercises: 2
  },
  {
    id: 'ch5-functions',
    title: 'Creating Reusable Functions',
    description: 'Learn to organize your code into reusable pieces that make programming more efficient.',
    estimatedTime: '120 min',
    difficulty: 'Intermediate',
    completed: false,
    locked: true,
    concepts: ['Defining functions', 'Parameters and arguments', 'Return values', 'Scope'],
    practiceExercises: 3
  }
];

const LearnSection: React.FC = () => {
  const navigate = useNavigate();
  
  const handleStartChapter = (chapterId: string) => {
    // Navigate to the chapter content
    navigate(`/learn/${chapterId}`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'text-green-600 bg-green-100';
      case 'Intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'Advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="text-blue-600" size={32} />
          <h1 className="text-3xl font-bold text-gray-800">Learn Python</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl">
          Master Python programming through our structured learning path. Each chapter builds on the previous one,
          taking you from complete beginner to confident programmer.
        </p>
      </div>

      {/* Progress Overview */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Learning Progress</h2>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 bg-gray-200 rounded-full h-3">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full" style={{width: '0%'}}></div>
          </div>
          <span className="text-sm font-medium text-gray-600">0% Complete</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">0</div>
            <div className="text-sm text-gray-600">Chapters Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">5</div>
            <div className="text-sm text-gray-600">Total Chapters</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">0</div>
            <div className="text-sm text-gray-600">Practice Exercises Done</div>
          </div>
        </div>
      </div>

      {/* Chapter List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Learning Chapters</h2>
        
        {mockChapters.map((chapter, index) => (
          <div
            key={chapter.id}
            className={`
              bg-white rounded-lg border shadow-sm transition-all duration-200 overflow-hidden
              ${chapter.locked ? 'opacity-60' : 'hover:shadow-md hover:border-blue-200'}
            `}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {chapter.completed ? (
                      <CheckCircle className="text-green-500" size={24} />
                    ) : chapter.locked ? (
                      <Lock className="text-gray-400" size={24} />
                    ) : (
                      <Circle className="text-blue-500" size={24} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold text-gray-800">
                        Chapter {index + 1}: {chapter.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(chapter.difficulty)}`}>
                        {chapter.difficulty}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{chapter.description}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <Clock size={16} />
                  <span>{chapter.estimatedTime}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target size={16} />
                  <span>{chapter.practiceExercises} practice exercises</span>
                </div>
              </div>

              {/* Concepts Preview */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb size={16} className="text-yellow-500" />
                  <span className="text-sm font-medium text-gray-700">You&apos;ll learn:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {chapter.concepts.map((concept, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleStartChapter(chapter.id)}
                  disabled={chapter.locked}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
                    ${chapter.locked
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : chapter.completed
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                    }
                  `}
                >
                  {chapter.completed ? 'Review Chapter' : 'Start Learning'}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Coming Soon */}
      <div className="mt-8 text-center p-8 bg-gray-50 rounded-lg">
        <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">More Chapters Coming Soon!</h3>
        <p className="text-gray-600">
          We&apos;re continuously adding new chapters covering advanced topics like classes, file handling,
          web development, and more. Stay tuned!
        </p>
      </div>
    </div>
  );
};

export default LearnSection;