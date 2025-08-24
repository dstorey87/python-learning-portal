import { Code } from 'lucide-react'

interface SolutionViewProps {
  solution: string
}

export const SolutionView = ({ solution }: SolutionViewProps) => {
  return (
    <div className="p-4 bg-gray-800/50 backdrop-blur-sm">
      <div className="flex items-center mb-3">
        <Code className="h-5 w-5 text-blue-400 mr-2" />
        <h3 className="text-lg font-semibold text-white">Solution</h3>
      </div>
      
      <div className="terminal-output mb-4">
        <pre>{solution}</pre>
      </div>
      
      <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
        <p className="text-sm text-blue-300">
          <strong className="text-blue-400">💡 Tip:</strong> Try to understand the solution rather than just copying it. 
          Each approach teaches you different Python concepts and best practices.
        </p>
      </div>
    </div>
  )
}