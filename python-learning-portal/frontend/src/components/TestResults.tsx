import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { TestResult } from '@portal/types'

interface TestResultsProps {
  results: TestResult
}

export const TestResults = ({ results }: TestResultsProps) => {
  const { passed, output, errors, testCases, executionTime } = results

  return (
    <div className="p-4 bg-gray-800/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Test Results</h3>
        <div className="flex items-center space-x-2">
          <div className="flex items-center text-sm text-gray-400">
            <Clock className="h-4 w-4 mr-1" />
            {executionTime}ms
          </div>
          <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
            passed 
              ? 'bg-green-500/20 text-green-400 border-green-500/30' 
              : 'bg-red-500/20 text-red-400 border-red-500/30'
          }`}>
            {passed ? (
              <CheckCircle className="h-4 w-4 mr-1" />
            ) : (
              <XCircle className="h-4 w-4 mr-1" />
            )}
            {passed ? 'All Passed' : 'Failed'}
          </div>
        </div>
      </div>

      {/* Test Cases */}
      <div className="space-y-3 mb-4">
        {testCases.map((testCase, index) => (
          <div
            key={index}
            className={`border rounded-lg p-3 bg-gray-700/30 backdrop-blur-sm ${
              testCase.passed 
                ? 'border-green-500/30 bg-green-500/10' 
                : 'border-red-500/30 bg-red-500/10'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm text-white">{testCase.name}</h4>
              <div className={`flex items-center text-sm ${
                testCase.passed ? 'text-green-400' : 'text-red-400'
              }`}>
                {testCase.passed ? (
                  <CheckCircle className="h-4 w-4 mr-1" />
                ) : (
                  <XCircle className="h-4 w-4 mr-1" />
                )}
                {testCase.passed ? 'Pass' : 'Fail'}
              </div>
            </div>

            {testCase.error && (
              <div className="text-sm text-red-300 bg-red-900/30 p-3 rounded font-mono border border-red-500/30">
                {testCase.error}
              </div>
            )}

            {testCase.expected !== undefined && testCase.actual !== undefined && (
              <div className="grid grid-cols-2 gap-3 mt-2 text-xs">
                <div>
                  <div className="font-medium text-gray-400 mb-1">Expected:</div>
                  <div className="bg-gray-800/50 p-2 rounded font-mono text-gray-200 border border-gray-600/50">
                    {JSON.stringify(testCase.expected)}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-400 mb-1">Actual:</div>
                  <div className="bg-gray-800/50 p-2 rounded font-mono text-gray-200 border border-gray-600/50">
                    {JSON.stringify(testCase.actual)}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Output */}
      {output && (
        <div className="mb-4">
          <h4 className="font-medium text-sm text-gray-300 mb-2">Output:</h4>
          <div className="terminal-output">
            <pre>{output}</pre>
          </div>
        </div>
      )}

      {/* Errors */}
      {errors && (
        <div>
          <h4 className="font-medium text-sm text-red-400 mb-2">Errors:</h4>
          <div className="bg-red-900/30 border border-red-500/30 p-3 rounded font-mono text-sm text-red-300 overflow-x-auto">
            <pre>{errors}</pre>
          </div>
        </div>
      )}
    </div>
  )
}