import { Menu, Bell, User, Settings, Code, Zap } from 'lucide-react'
import { useAppStore } from '../store/appStore'

export const Header = () => {
  const { user, sidebarOpen, setSidebarOpen } = useAppStore()

  return (
    <header className="bg-gray-800/90 backdrop-blur-sm border-b border-gray-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Left side - Menu button and title */}
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 lg:hidden transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="ml-4 lg:ml-0 flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Code className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    PyLearn
                  </h1>
                  <div className="flex items-center space-x-1 text-xs text-gray-400">
                    <Zap className="h-3 w-3" />
                    <span>Interactive Python Learning - Frontend Package Updated!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - User menu */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User info */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-3 bg-gray-700/50 rounded-lg px-3 py-2">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="text-sm">
                  <div className="text-white font-medium">
                    {user?.username || 'Guest'}
                  </div>
                  <div className="text-gray-400 text-xs">
                    Python Learner
                  </div>
                </div>
              </div>

              {/* Settings */}
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}