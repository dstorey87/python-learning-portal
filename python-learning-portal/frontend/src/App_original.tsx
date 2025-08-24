import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ExerciseView } from './components/ExerciseView'
import { Dashboard } from './components/Dashboard'
import { useAppStore } from './store/appStore'
import { userApi } from './api/userApi'

function App() {
  const { setUser } = useAppStore()

  useEffect(() => {
    // Initialize user session
    const initializeUser = async () => {
      const username = localStorage.getItem('username')
      if (username) {
        try {
          const userData = await userApi.createOrGetUser(username)
          setUser(userData)
        } catch (error) {
          console.error('Failed to initialize user:', error)
          localStorage.removeItem('username')
        }
      }
    }

    initializeUser()
  }, [setUser])

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        <Route path="/dashboard" element={
          <Layout>
            <Dashboard />
          </Layout>
        } />
        
        <Route path="/exercise/:exerciseId" element={
          <Layout>
            <ExerciseView />
          </Layout>
        } />
        
        {/* Catch-all route */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
              <p className="text-gray-600 mb-8">Page not found</p>
              <a 
                href="/dashboard" 
                className="btn-primary"
              >
                Go to Dashboard
              </a>
            </div>
          </div>
        } />
      </Routes>
    </div>
  )
}

export default App