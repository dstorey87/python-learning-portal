import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Exercise, User, UserProgress, TestResult, UIState } from '@shared/types'

interface AppState extends UIState {
  // User state
  user: User | null
  setUser: (user: User | null) => void
  
  // Exercises
  exercises: Exercise[]
  setExercises: (exercises: Exercise[]) => void
  
  // Progress
  userProgress: UserProgress[]
  setUserProgress: (progress: UserProgress[]) => void
  updateExerciseProgress: (progress: UserProgress) => void
  
  // UI state
  setCurrentExercise: (exercise: Exercise | null) => void
  setUserCode: (code: string) => void
  setIsRunning: (isRunning: boolean) => void
  setShowSolution: (show: boolean) => void
  setShowHints: (show: boolean) => void
  setTestResults: (results: TestResult | null) => void
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark') => void
  
  // Session
  sessionStartTime: Date | null
  startSession: () => void
  endSession: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      exercises: [],
      userProgress: [],
      
      // UI state
      currentExercise: null,
      userCode: '',
      isRunning: false,
      showSolution: false,
      showHints: false,
      testResults: null,
      sidebarOpen: true,
      theme: 'light',
      
      // Session
      sessionStartTime: null,
      
      // Actions
      setUser: (user) => set({ user }),
      
      setExercises: (exercises) => set({ exercises }),
      
      setUserProgress: (userProgress) => set({ userProgress }),
      
      updateExerciseProgress: (progress) => set((state) => ({
        userProgress: state.userProgress.some(p => p.exerciseId === progress.exerciseId)
          ? state.userProgress.map(p => p.exerciseId === progress.exerciseId ? progress : p)
          : [...state.userProgress, progress]
      })),
      
      setCurrentExercise: (currentExercise) => {
        const userCode = currentExercise?.starterCode || ''
        set({ 
          currentExercise, 
          userCode,
          showSolution: false,
          showHints: false,
          testResults: null 
        })
      },
      
      setUserCode: (userCode) => set({ userCode }),
      
      setIsRunning: (isRunning) => set({ isRunning }),
      
      setShowSolution: (showSolution) => set({ showSolution }),
      
      setShowHints: (showHints) => set({ showHints }),
      
      setTestResults: (testResults) => set({ testResults }),
      
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      
      setTheme: (theme) => set({ theme }),
      
      startSession: () => set({ sessionStartTime: new Date() }),
      
      endSession: () => set({ sessionStartTime: null }),
    }),
    {
      name: 'python-learning-portal-storage',
      partialize: (state) => ({
        user: state.user,
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
)