import { useState } from 'react'
import { useQuery } from 'react-query'
import { Lightbulb, ChevronDown, ChevronRight, Eye } from 'lucide-react'
import { exerciseApi } from '../api/exerciseApi'

interface HintsPanelProps {
  exerciseId: string
}

export const HintsPanel = ({ exerciseId }: HintsPanelProps) => {
  const [revealedHints, setRevealedHints] = useState<Set<string>>(new Set())
  const [expandedHints, setExpandedHints] = useState<Set<string>>(new Set())

  const { data: hints = [], isLoading } = useQuery(
    ['hints', exerciseId],
    () => exerciseApi.getHints(exerciseId),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  )

  const revealHint = (hintId: string) => {
    setRevealedHints(prev => new Set([...prev, hintId]))
  }

  const toggleHintExpanded = (hintId: string) => {
    setExpandedHints(prev => {
      const newSet = new Set(prev)
      if (newSet.has(hintId)) {
        newSet.delete(hintId)
      } else {
        newSet.add(hintId)
      }
      return newSet
    })
  }

  if (isLoading) {
    return (
      <div className="p-4 bg-gray-800/50 backdrop-blur-sm">
        <div className="flex items-center mb-4">
          <Lightbulb className="h-5 w-5 text-yellow-400 mr-2" />
          <h3 className="text-lg font-semibold text-white">Hints</h3>
        </div>
        <div className="text-sm text-gray-400">Loading hints...</div>
      </div>
    )
  }

  if (hints.length === 0) {
    return (
      <div className="p-4 bg-gray-800/50 backdrop-blur-sm">
        <div className="flex items-center mb-4">
          <Lightbulb className="h-5 w-5 text-yellow-400 mr-2" />
          <h3 className="text-lg font-semibold text-white">Hints</h3>
        </div>
        <div className="text-sm text-gray-400">No hints available for this exercise.</div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-gray-800/50 backdrop-blur-sm">
      <div className="flex items-center mb-4">
        <Lightbulb className="h-5 w-5 text-yellow-400 mr-2" />
        <h3 className="text-lg font-semibold text-white">Hints</h3>
      </div>

      <div className="space-y-3">
        {hints.map((hint, index) => {
          const isRevealed = revealedHints.has(hint.id)
          const isExpanded = expandedHints.has(hint.id)

          return (
            <div
              key={hint.id}
              className="border border-gray-600/50 rounded-lg overflow-hidden bg-gray-700/30"
            >
              <div
                className="p-3 bg-gray-700/50 cursor-pointer hover:bg-gray-600/50 transition-colors"
                onClick={() => toggleHintExpanded(hint.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-400 mr-2" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-400 mr-2" />
                    )}
                    <span className="font-medium text-sm text-white">
                      Hint {index + 1}: {hint.title}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                      hint.revealLevel === 1 ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      hint.revealLevel === 2 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                      'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}>
                      Level {hint.revealLevel}
                    </span>
                    {!isRevealed && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          revealHint(hint.id)
                        }}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Reveal
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="p-3 border-t border-gray-600/50">
                  {isRevealed ? (
                    <div className="prose prose-sm prose-invert">
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {hint.content}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="text-gray-400 mb-3">
                        <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Hint is hidden</p>
                      </div>
                      <button
                        onClick={() => revealHint(hint.id)}
                        className="btn-secondary"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Reveal Hint
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
        <p className="text-sm text-yellow-300">
          <strong className="text-yellow-400">💡 Remember:</strong> Try to solve the problem yourself first! 
          Use hints only when you&apos;re truly stuck. Each hint reveals progressively more information.
        </p>
      </div>
    </div>
  )
}