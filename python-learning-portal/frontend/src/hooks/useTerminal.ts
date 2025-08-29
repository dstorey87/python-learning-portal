import { useRef } from 'react'

import { useRef } from 'react'

export interface TerminalRef {
  addOutput: (output: string) => void
  addError: (error: string) => void
  clear: () => void
  setRunning: (running: boolean) => void
}

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