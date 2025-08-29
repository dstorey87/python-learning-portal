import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from 'react-query'
import { Play, RotateCcw, Eye, EyeOff, Lightbulb, CheckCircle } from 'lucide-react'
import { MonacoEditor } from './MonacoEditor'
import { TestResults } from './TestResults'
import { SolutionView } from './SolutionView'
import { HintsPanel } from './HintsPanel'
import { Terminal, useTerminal } from './Terminal'
import { exerciseApi } from '../api/exerciseApi'
import { executionApi } from '../api/executionApi'
import { progressApi } from '../api/progressApi'
import { useAppStore } from '../store/appStore'
import toast from 'react-hot-toast'

export const ExerciseView = () => {
  const { exerciseId } = useParams<{ exerciseId: string }>()
  const navigate = useNavigate()
  const {
    user,
    userCode,
    setUserCode,
    isRunning,
    setIsRunning,
    showSolution,
    setShowSolution,
    showHints,
    setShowHints,
    testResults,
    setTestResults,
    setCurrentExercise,
    updateExerciseProgress
  } = useAppStore()

  const [startTime, setStartTime] = useState<Date | null>(null)
  const [isTerminalMinimized, setIsTerminalMinimized] = useState(false)
  const { terminalRef, addOutput, addError, clear: clearTerminal, setRunning: setTerminalRunning } = useTerminal()

  // Fetch exercise data
  const { data: exercise, isLoading } = useQuery(
    ['exercise', exerciseId],
    () => exerciseApi.getExercise(exerciseId!),
    {
      enabled: !!exerciseId,
      onSuccess: (exercise) => {
        setCurrentExercise(exercise)
        if (!userCode || userCode === exercise.starterCode) {
          setUserCode(exercise.starterCode)
        }
        setStartTime(new Date())
      }
    }
  )

  // Fetch user progress
  const { data: progress } = useQuery(
    ['progress', user?.id, exerciseId],
    () => progressApi.getExerciseProgress(user!.id, exerciseId!),
    {
      enabled: !!user && !!exerciseId
    }
  )

  // Run code mutation
  const runCodeMutation = useMutation(executionApi.runCode, {
    onSuccess: (result) => {
      setTestResults(result.testResult || null)
      setIsRunning(false)
      setTerminalRunning(false)
      
      // Display formatted output in terminal
      if (result.output) {
        const formattedOutput = `📤 Output:\n${result.output}`;
        addOutput(formattedOutput)
      }
      if (result.errors) {
        const formattedError = `❌ Error:\n${result.errors}`;
        addError(formattedError)
      }
      
      // Show execution time for performance feedback
      if (result.executionTime !== undefined) {
        addOutput(`⏱️  Execution time: ${result.executionTime}ms`)
      }
      
      if (result.testResult?.passed) {
        toast.success('All tests passed! 🎉')
        handleExerciseComplete()
        addOutput('✅ All tests passed!')
      } else if (result.testResult) {
        toast.error('Some tests failed. Keep trying!')
        addError('❌ Some tests failed')
      } else if (result.success) {
        toast.success('Code executed successfully!')
        addOutput('✅ Code executed successfully')
      } else {
        toast.error('Code execution failed')
        addError('❌ Code execution failed')
      }
    },
    onError: (error: Error) => {
      setIsRunning(false)
      setTerminalRunning(false)
      setTestResults(null)
      toast.error(error.message || 'Failed to run code')
      addError(`❌ Error: ${error.message || 'Failed to run code'}`)
    }
  })

  // Update progress mutation
  const updateProgressMutation = useMutation(
    (data: { completed?: boolean; solution?: string; timeSpent?: number }) =>
      progressApi.updateProgress(user!.id, exerciseId!, data),
    {
      onSuccess: (updatedProgress) => {
        updateExerciseProgress(updatedProgress)
      }
    }
  )

  const handleRunCode = async (withTests: boolean = false) => {
    if (!exercise || !user) return
    
    setIsRunning(true)
    setTerminalRunning(true)
    setTestResults(null)

    // Add command to terminal
    addOutput(`$ ${withTests ? 'run tests' : 'run code'}`)

    try {
      await runCodeMutation.mutateAsync({
        code: userCode,
        exerciseId: exercise.id,
        runTests: withTests
      })
      
      // Update attempt count
      const timeSpent = startTime ? Math.floor((Date.now() - startTime.getTime()) / 1000) : 0
      updateProgressMutation.mutate({ timeSpent })
      
    } catch (error) {
      console.error('Run code error:', error)
    }
  }

  const handleTerminalCommand = (command: string) => {
    const cmd = command.toLowerCase().trim()
    
    switch (cmd) {
      case 'run':
      case 'run code':
        handleRunCode(false)
        break
      case 'test':
      case 'run tests':
        handleRunCode(true)
        break
      case 'clear':
        clearTerminal()
        break
      case 'reset':
        handleReset()
        addOutput('Code reset to starter template')
        break
      case 'help':
        addOutput([
          'Available commands:',
          '  run, run code - Execute your Python code',
          '  test, run tests - Run the exercise tests',
          '  clear - Clear the terminal',
          '  reset - Reset code to starter template',
          '  help - Show this help message'
        ].join('\n'))
        break
      default:
        addError(`Unknown command: ${command}. Type 'help' for available commands.`)
    }
  }

  const handleExerciseComplete = async () => {
    if (!user || !exercise || !startTime) return
    
    const timeSpent = Math.floor((Date.now() - startTime.getTime()) / 1000)
    
    try {
      await updateProgressMutation.mutateAsync({
        completed: true,
        solution: userCode,
        timeSpent
      })
      
      // Celebrate completion
      setTimeout(() => {
        toast.success(`🎉 Exercise completed! Great job!`, { duration: 5000 })
      }, 1000)
      
    } catch (error) {
      console.error('Failed to update progress:', error)
    }
  }

  const handleReset = () => {
    if (exercise) {
      setUserCode(exercise.starterCode)
      setTestResults(null)
      clearTerminal()
      setStartTime(new Date())
      toast('Code reset to starter template')
    }
  }

  const handleNextExercise = () => {
    // TODO: Navigate to next exercise
    toast('Next exercise navigation not implemented yet')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
        <span className="ml-2 text-gray-300">Loading exercise...</span>
      </div>
    )
  }

  if (!exercise) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white mb-4">Exercise not found</h2>
        <button onClick={() => navigate('/dashboard')} className="btn-primary">
          Go to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="card mb-0 rounded-none border-x-0 border-t-0 border-gray-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{exercise.title}</h1>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-300">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                exercise.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                exercise.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {exercise.difficulty}
              </span>
              <span className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                {exercise.estimatedTime} minutes
              </span>
              {progress?.completed && (
                <div className="flex items-center text-green-400">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Completed
                </div>
              )}
              {progress && (progress.attempts || 0) > 0 && (
                <span className="text-gray-400">{progress.attempts} attempt{progress.attempts !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowHints(!showHints)}
              className={`btn-secondary ${showHints ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : ''}`}
            >
              <Lightbulb className="h-4 w-4 mr-1" />
              Hints
            </button>

            <button
              onClick={() => setShowSolution(!showSolution)}
              className={`btn-secondary ${showSolution ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : ''}`}
            >
              {showSolution ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
              Solution
            </button>

            <button
              onClick={handleReset}
              className="btn-secondary"
              disabled={isRunning}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </button>

            <button
              onClick={() => handleRunCode(false)}
              className="btn-primary"
              disabled={isRunning}
            >
              <Play className="h-4 w-4 mr-1" />
              Run Code
            </button>

            <button
              onClick={() => handleRunCode(true)}
              className="btn-success"
              disabled={isRunning}
            >
              {isRunning && <div className="spinner mr-2" />}
              Run Tests
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Instructions and Editor */}
        <div className="flex-1 flex flex-col">
          {/* Instructions */}
          <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 border-b border-gray-700/50 px-6 py-4 backdrop-blur-sm">
            <div className="prose prose-sm prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: exercise.instructions }} />
            </div>
          </div>

          {/* Code Editor */}
          <div className="flex-1 flex flex-col">
            <div className="bg-gray-900" style={{ height: '400px' }}>
              <MonacoEditor
                value={userCode}
                onChange={setUserCode}
                language="python"
                theme="vs-dark"
                height="400px"
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  tabSize: 4,
                  insertSpaces: true,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  folding: true,
                  bracketPairColorization: { enabled: true },
                  lineHeight: 24,
                  automaticLayout: true
                }}
              />
            </div>
            
            {/* Terminal */}
            <div className="border-t border-gray-700/50">
              <Terminal
                ref={terminalRef}
                className="w-full"
                onCommand={handleTerminalCommand}
                isMinimized={isTerminalMinimized}
                onToggleMinimize={() => setIsTerminalMinimized(!isTerminalMinimized)}
              />
            </div>
          </div>
        </div>

        {/* Right Panel - Results, Solution, Hints */}
        <div className="w-96 border-l border-gray-700/50 bg-gray-800/50 backdrop-blur-sm flex flex-col">
          {/* Test Results */}
          {testResults && (
            <div className="border-b border-gray-700/50">
              <TestResults results={testResults} />
            </div>
          )}

          {/* Solution */}
          {showSolution && (
            <div className="border-b border-gray-700/50">
              <SolutionView solution={exercise.solutionCode} />
            </div>
          )}

          {/* Hints */}
          {showHints && (
            <div className="flex-1">
              <HintsPanel exerciseId={exercise.id} />
            </div>
          )}

          {/* Exercise completed celebration */}
          {progress?.completed && (
            <div className="p-6 bg-gradient-to-r from-green-500/20 to-emerald-600/20 border-t border-green-500/30">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Exercise Complete! 🎉
                </h3>
                <p className="text-sm text-gray-300 mb-4">
                  Great job! You&apos;ve successfully completed this exercise.
                </p>
                <button
                  onClick={handleNextExercise}
                  className="btn-success"
                >
                  Next Exercise
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}