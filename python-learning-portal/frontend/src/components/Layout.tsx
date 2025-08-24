import React from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { ConnectionStatus } from './ConnectionStatus'
import { useAppStore } from '../store/appStore'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { sidebarOpen, setSidebarOpen } = useAppStore()

  return (
    <div className="min-h-screen w-full flex bg-gray-900">
      {/* Background gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pointer-events-none" />
      
      {/* Sidebar */}
      <div className={`
        transform transition-transform duration-300 ease-in-out relative z-30
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
        w-64 lg:w-72 xl:w-80 bg-gray-800 shadow-2xl border-r border-gray-700 flex-shrink-0
      `}>
        <div className="glass h-full min-h-screen">
          <Sidebar />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen w-full relative z-10">
        <Header />
        
        <main className="flex-1 relative focus:outline-none w-full">
          {/* Connection status indicator */}
          <div className="sticky top-0 z-10 p-4">
            <ConnectionStatus />
          </div>
          
          <div className="py-8 px-6 lg:px-8 w-full">
            <div className="max-w-7xl mx-auto w-full">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <>
          <div 
            className="fixed inset-0 z-20 bg-black opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-0 z-25 bg-gradient-to-r from-blue-500/20 to-purple-600/20 backdrop-blur-sm lg:hidden" />
        </>
      )}
    </div>
  )
}