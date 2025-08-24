import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { Terminal as TerminalIcon, Minimize2, Maximize2 } from 'lucide-react'

interface TerminalLine {
  id: string
  type: 'input' | 'output' | 'error'
  content: string
  timestamp: Date
}

interface TerminalProps {
  className?: string
  onCommand?: (command: string) => void
  isMinimized?: boolean
  onToggleMinimize?: () => void
}

export interface TerminalRef {
  addOutput: (output: string) => void
  addError: (error: string) => void
  clear: () => void
  setRunning: (running: boolean) => void
}

export const Terminal = forwardRef<TerminalRef, TerminalProps>(({ 
  className = '', 
  onCommand,
  isMinimized = false,
  onToggleMinimize 
}, ref) => {
  const [lines, setLines] = useState<TerminalLine[]>([])
  const [input, setInput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new lines are added
  useEffect(() => {
    if (terminalRef.current && !isMinimized) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [lines, isMinimized])

  // Focus input when terminal is clicked
  const handleTerminalClick = () => {
    if (inputRef.current && !isMinimized) {
      inputRef.current.focus()
    }
  }

  const addLine = (type: TerminalLine['type'], content: string) => {
    const newLine: TerminalLine = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    }
    setLines(prev => [...prev, newLine])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isRunning) return

    // Add command to terminal
    addLine('input', `$ ${input}`)
    
    // Execute command
    if (onCommand) {
      setIsRunning(true)
      onCommand(input)
    }
    
    setInput('')
  }

  // Public methods that can be called from parent
  useImperativeHandle(ref, () => ({
    addOutput: (output: string) => {
      setIsRunning(false)
      if (output.trim()) {
        addLine('output', output)
      }
    },
    addError: (error: string) => {
      setIsRunning(false)
      if (error.trim()) {
        addLine('error', error)
      }
    },
    clear: () => {
      setLines([])
    },
    setRunning: (running: boolean) => {
      setIsRunning(running)
    }
  }), [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  return (
    <div className={`bg-gray-900 border border-gray-700/50 rounded-lg overflow-hidden ${className}`}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 border-b border-gray-700/50">
        <div className="flex items-center space-x-2">
          <TerminalIcon className="h-4 w-4 text-green-400" />
          <span className="text-sm font-medium text-gray-300">Python Terminal</span>
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleMinimize}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            title={isMinimized ? "Maximize" : "Minimize"}
          >
            {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      {!isMinimized && (
        <div 
          className="relative h-64 bg-gray-900 cursor-text"
          onClick={handleTerminalClick}
        >
          {/* Terminal Lines */}
          <div 
            ref={terminalRef}
            className="h-full overflow-y-auto p-3 font-mono text-sm"
          >
            {lines.length === 0 && (
              <div className="text-gray-500 mb-2">
                Python {navigator.userAgent.includes('Windows') ? 'on Windows' : 'Terminal'} - Ready for code execution
              </div>
            )}
            
            {lines.map((line) => (
              <div key={line.id} className="mb-1 flex">
                <span className="text-xs text-gray-500 mr-2 flex-shrink-0 mt-0.5">
                  {formatTime(line.timestamp)}
                </span>
                <div className="flex-1">
                  <div className={`whitespace-pre-wrap break-words ${
                    line.type === 'input' ? 'text-blue-400 font-semibold' :
                    line.type === 'error' ? 'text-red-400' :
                    'text-gray-100'
                  }`}>
                    {line.content}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Current Input Line */}
            <form onSubmit={handleSubmit} className="flex items-start">
              <span className="text-xs text-gray-500 mr-2 mt-0.5">
                {formatTime(new Date())}
              </span>
              <div className="flex-1 flex">
                <span className="text-blue-400 font-semibold">$</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isRunning}
                  className="flex-1 bg-transparent text-gray-100 font-mono outline-none ml-1 disabled:opacity-50"
                  placeholder={isRunning ? "Running..." : "Type 'run' to execute code, 'clear' to clear terminal"}
                  autoComplete="off"
                  spellCheck={false}
                />
                {isRunning && (
                  <div className="ml-2 flex items-center">
                    <div className="w-3 h-3 border border-green-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
})

Terminal.displayName = 'Terminal'

// Hook for managing terminal state
export const useTerminal = () => {
  const terminalRef = useRef<TerminalRef>(null)

  const addOutput = (output: string) => {
    terminalRef.current?.addOutput(output)
  }

  const addError = (error: string) => {
    terminalRef.current?.addError(error)
  }

  const clear = () => {
    terminalRef.current?.clear()
  }

  const setRunning = (running: boolean) => {
    terminalRef.current?.setRunning(running)
  }

  return {
    terminalRef,
    addOutput,
    addError,
    clear,
    setRunning
  }
}