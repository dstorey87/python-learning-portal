import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  BookOpen, 
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';
import EmbeddedTerminal from './EmbeddedTerminal';
import { ContentBlockRenderer, SectionHeader, KeyConcepts, ContentBlock } from './ContentBlocks';
import ConceptTags from './ConceptTags';

interface Chapter {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  sections: Section[];
}

interface Section {
  id: string;
  title: string;
  type: 'theory' | 'example' | 'interactive';
  description?: string;
  content: ContentBlock[];
  conceptIds?: string[]; // New: Array of concept IDs for this section
  codeExample?: {
    code: string;
    title?: string;
    explanation?: string;
  };
  keyConcepts?: string[];
  terminal?: {
    defaultCode: string;
    title?: string;
    instructions?: string;
  };
}

// Sample chapter data - in real app this would come from API
const chapterData: Record<string, Chapter> = {
  'ch1-basics': {
    id: 'ch1-basics',
    title: 'Python Basics & Your First Program',
    description: 'Start your Python journey! Learn what Python is, write your first program, and understand variables.',
    estimatedTime: '45 min',
    difficulty: 'Beginner',
    sections: [
      {
        id: 'intro',
        title: 'What is Python?',
        type: 'theory',
        description: 'Discover the power and simplicity of Python programming',
        content: [
          {
            type: 'paragraph',
            content: 'Python is a powerful, easy-to-learn programming language that has taken the world by storm! It\'s the perfect choice for beginners and professionals alike.'
          },
          {
            type: 'highlight',
            title: 'Why Python is Amazing',
            content: 'Python reads almost like English, making it incredibly beginner-friendly while still being powerful enough for complex applications.',
            color: 'blue'
          },
          {
            type: 'list',
            title: 'What can you build with Python?',
            content: [
              'Web applications and websites (like Instagram, Spotify)',
              'Data analysis and visualization tools',
              'Artificial Intelligence and Machine Learning models',
              'Automation scripts to save you time',
              'Games and desktop applications',
              'Scientific computing and research tools'
            ]
          },
          {
            type: 'tip',
            title: 'Fun Fact!',
            content: 'Python was named after the British comedy series "Monty Python\'s Flying Circus" - the creator wanted a name that was short, unique, and slightly mysterious!',
            color: 'purple'
          }
        ],
        keyConcepts: ['High-level programming language', 'Easy-to-read syntax', 'Versatile applications', 'Large community support']
      },
      {
        id: 'first-program',
        title: 'Writing Your First Python Program',
        type: 'example',
        description: 'Let\'s write some actual Python code!',
        conceptIds: ['print', 'string', 'comments'],
        content: [
          {
            type: 'paragraph',
            content: 'Every programmer\'s journey begins with a simple "Hello, World!" program. It\'s a tradition that goes back decades!'
          },
          {
            type: 'steps',
            title: 'Let\'s break down our first program:',
            content: [
              'We use the print() function to display text',
              'Text goes inside quotes (single or double)',
              'Python executes the code line by line',
              'The output appears in the terminal'
            ]
          }
        ],
        codeExample: {
          code: `# Your first Python program!
print("Hello, World!")

# You can print other messages too
print("Welcome to Python programming!")
print("This is fun!")

# Try changing the messages above!`,
          title: 'Hello World Example',
          explanation: 'This is your first Python program! The # symbol creates comments that help explain your code.'
        },
        terminal: {
          defaultCode: `# Try it yourself! Change this message:
print("Hello, World!")

# Add your own print statements:
print("My name is ...")
print("I'm learning Python!")`,
          title: 'Your First Python Code',
          instructions: 'Modify the code above and click "Run Code" to see what happens!'
        }
      },
      {
        id: 'variables',
        title: 'Understanding Variables',
        type: 'theory',
        description: 'Learn to store and use data in your programs',
        conceptIds: ['variables', 'assignment', 'string', 'integer'],
        content: [
          {
            type: 'paragraph',
            content: 'Variables are like labeled containers that store different types of information. Think of them as boxes with name tags!'
          },
          {
            type: 'highlight',
            title: 'What makes a good variable name?',
            content: 'Choose names that clearly describe what the variable contains. Future you will thank present you!',
            color: 'green'
          },
          {
            type: 'list',
            title: 'Variable naming rules in Python:',
            content: [
              'Must start with a letter or underscore (_)',
              'Can contain letters, numbers, and underscores',
              'Cannot contain spaces or special characters like !, @, #',
              'Case-sensitive (age and Age are different)',
              'Cannot use Python keywords (like print, if, else)'
            ]
          },
          {
            type: 'list',
            title: 'Examples of great variable names:',
            content: [
              'name (stores a person\'s name)',
              'user_age (stores someone\'s age)',
              'total_score (stores a game score)',
              'email_address (stores an email)'
            ]
          }
        ],
        codeExample: {
          code: `# Creating variables is easy!
name = "Alice"
age = 25
height = 5.6
is_student = True

# Using variables in print statements
print("Name:", name)
print("Age:", age, "years old")
print("Height:", height, "feet")
print("Is student:", is_student)`,
          title: 'Variable Examples',
          explanation: 'Notice how we can store different types of data: text (strings), numbers, and True/False values!'
        },
        terminal: {
          defaultCode: `# Create your own variables:
my_name = "Your Name Here"
my_age = 20
favorite_color = "blue"

# Now print them:
print("Hi, I'm", my_name)
print("I am", my_age, "years old")
print("My favorite color is", favorite_color)

# Try creating more variables!`,
          title: 'Create Your Variables',
          instructions: 'Replace the example values with your own information and run the code!'
        }
      },
      {
        id: 'practice',
        title: 'Try It Yourself!',
        type: 'interactive',
        description: 'Put your new skills to the test',
        content: [
          {
            type: 'success',
            title: 'Great job getting this far!',
            content: 'You\'ve learned about Python basics, your first program, and variables. Now let\'s practice!',
            color: 'green'
          },
          {
            type: 'steps',
            title: 'Your challenge:',
            content: [
              'Create variables for your name, age, and favorite programming language (hint: it should be Python!)',
              'Use print() to introduce yourself',
              'Add a fun fact about yourself',
              'Experiment with different variable names and values'
            ]
          },
          {
            type: 'tip',
            title: 'Remember',
            content: 'There\'s no "wrong" way to practice. Try different things, make mistakes, and learn from them!',
            color: 'blue'
          }
        ],
        terminal: {
          defaultCode: `# Your coding challenge:
# 1. Create variables for your information
name = "Your Name"
age = 25
favorite_language = "Python"

# 2. Create an introduction message
print("Hello! My name is", name)

# 3. Add more information about yourself
# (Write your code below)

# 4. Try creating new variables and printing them
# Be creative!`,
          title: 'Your Coding Challenge',
          instructions: 'Complete the challenge by filling in your own information and adding more code!'
        }
      }
    ]
  }
};

const ChapterContent: React.FC = () => {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  const chapter = chapterData[chapterId || ''];

  if (!chapter) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Chapter Not Found</h1>
        <p className="text-gray-600 mb-6">The chapter you&apos;re looking for doesn&apos;t exist yet.</p>
        <button 
          onClick={() => navigate('/learn')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Learn
        </button>
      </div>
    );
  }

  const currentSection = chapter.sections[currentSectionIndex];
  const isLastSection = currentSectionIndex === chapter.sections.length - 1;
  const isFirstSection = currentSectionIndex === 0;

  const handleNextSection = () => {
    if (!isLastSection) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    } else {
      // Chapter completed - could navigate to next chapter or back to learn
      navigate('/learn');
    }
  };

  const handlePrevSection = () => {
    if (!isFirstSection) {
      setCurrentSectionIndex(currentSectionIndex - 1);
    }
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
      <div className="mb-8 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <button 
          onClick={() => navigate('/learn')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Learn
        </button>
        
        <div className="flex items-center gap-4 mb-4">
          <BookOpen className="text-blue-600" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{chapter.title}</h1>
            <p className="text-gray-600">{chapter.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Clock size={16} />
            <span>{chapter.estimatedTime}</span>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(chapter.difficulty)}`}>
            {chapter.difficulty}
          </span>
          <div className="flex items-center gap-1">
            <Target size={16} />
            <span>Section {currentSectionIndex + 1} of {chapter.sections.length}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Chapter Progress</span>
          <span>{Math.round(((currentSectionIndex + 1) / chapter.sections.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentSectionIndex + 1) / chapter.sections.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Concept Tags */}
      {currentSection.conceptIds && (
        <ConceptTags 
          conceptIds={currentSection.conceptIds}
          className="mb-6"
        />
      )}

      {/* Section Content */}
      <div className="mb-8">
        <SectionHeader 
          title={currentSection.title}
          type={currentSection.type}
          description={currentSection.description}
        />

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8">
            {/* Key Concepts */}
            {currentSection.keyConcepts && (
              <KeyConcepts 
                concepts={currentSection.keyConcepts}
                className="mb-6"
              />
            )}

            {/* Content Blocks */}
            <div className="mb-6">
              {currentSection.content.map((block, index) => (
                <ContentBlockRenderer 
                  key={index}
                  block={block}
                />
              ))}
            </div>

            {/* Code Example */}
            {currentSection.codeExample && (
              <div className="mb-6">
                <div className="bg-gray-900 rounded-lg overflow-hidden">
                  <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-300">
                        {currentSection.codeExample.title || 'Code Example'}
                      </h3>
                      <div className="flex gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <pre className="text-green-400 text-sm overflow-x-auto font-mono">
                      <code>{currentSection.codeExample.code}</code>
                    </pre>
                  </div>
                </div>
                {currentSection.codeExample.explanation && (
                  <p className="text-sm text-gray-600 mt-2 px-2">
                    {currentSection.codeExample.explanation}
                  </p>
                )}
              </div>
            )}

            {/* Interactive Terminal */}
            {currentSection.terminal && (
              <div className="mb-6">
                <EmbeddedTerminal
                  defaultCode={currentSection.terminal.defaultCode}
                  title={currentSection.terminal.title}
                  height={250}
                  defaultMinimized={true}
                />
                {currentSection.terminal.instructions && (
                  <p className="text-sm text-blue-200 mt-2 px-3 py-2 bg-gray-800 border border-gray-600 rounded">
                    💡 {currentSection.terminal.instructions}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button 
          onClick={handlePrevSection}
          disabled={isFirstSection}
          className={`
            flex items-center px-6 py-3 rounded-lg font-medium transition-colors
            ${isFirstSection 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }
          `}
        >
          <ArrowLeft size={20} className="mr-2" />
          Previous
        </button>

        <div className="flex gap-2">
          {chapter.sections.map((_, index) => (
            <div
              key={index}
              className={`
                w-3 h-3 rounded-full transition-colors
                ${index <= currentSectionIndex ? 'bg-blue-600' : 'bg-gray-300'}
              `}
            />
          ))}
        </div>

        <button 
          onClick={handleNextSection}
          className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          {isLastSection ? (
            <>
              <CheckCircle size={20} className="mr-2" />
              Complete Chapter
            </>
          ) : (
            <>
              Next
              <ArrowRight size={20} className="ml-2" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ChapterContent;