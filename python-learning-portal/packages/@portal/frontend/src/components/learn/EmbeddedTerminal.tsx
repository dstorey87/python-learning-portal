import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Editor } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { Play, RotateCcw, Copy, Check, Terminal, Zap, ChevronDown } from 'lucide-react';
import { executionApi } from '../../api/executionApi';

interface EmbeddedTerminalProps {
  defaultCode?: string;
  title?: string;
  height?: number;
  readonly?: boolean;
  showTitle?: boolean;
  className?: string;
  defaultMinimized?: boolean; // Add option to start minimized
}

const EmbeddedTerminal: React.FC<EmbeddedTerminalProps> = ({
  defaultCode = '# Try your Python code here!\nprint("Hello, World!")',
  title = 'Try it yourself',
  height = 300,
  readonly = false,
  showTitle = true,
  className = '',
  defaultMinimized = false
}) => {
  const [code, setCode] = useState(defaultCode);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isMinimized, setIsMinimized] = useState(defaultMinimized);
  const editorRef = useRef<null | import('monaco-editor').editor.IStandaloneCodeEditor>(null);

  // Update code when defaultCode prop changes (for page navigation)
  useEffect(() => {
    setCode(defaultCode);
    setOutput(''); // Clear previous output
    setError(null); // Clear previous errors
    setIsMinimized(defaultMinimized); // Reset minimized state based on prop
    if (editorRef.current) {
      editorRef.current.setValue(defaultCode);
    }
  }, [defaultCode, defaultMinimized]);

  const handleEditorDidMount = (editor: import('monaco-editor').editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    
    // Configure editor for better learning experience
    editor.updateOptions({
      fontSize: 14,
      lineNumbers: 'on',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      theme: 'vs-dark',
      // Disable scroll wheel capture when not needed
      scrollbar: {
        vertical: 'hidden', // Hide vertical scrollbar since content is small
        horizontal: 'auto',
        handleMouseWheel: false // Don't capture mouse wheel events
      }
    });

    // Allow page scrolling when mouse is over Monaco editor
    const editorDomNode = editor.getDomNode();
    if (editorDomNode) {
      const handleWheelEvent = (e: WheelEvent) => {
        // Check if the editor actually needs to scroll
        const editorElement = editorDomNode.querySelector('.monaco-scrollable-element');
        if (editorElement) {
          const hasVerticalScroll = editorElement.scrollHeight > editorElement.clientHeight;
          const hasHorizontalScroll = editorElement.scrollWidth > editorElement.clientWidth;
          
          // If there's no scrollable content in the editor, let the page handle the scroll
          if (!hasVerticalScroll && !hasHorizontalScroll) {
            return; // Let the event bubble up to the page
          }
          
          // If scrolling vertically and at the edge, let page scroll continue
          if (e.deltaY !== 0) {
            const atTop = editorElement.scrollTop === 0;
            const atBottom = editorElement.scrollTop + editorElement.clientHeight >= editorElement.scrollHeight;
            
            if ((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom)) {
              return; // Let the event bubble up for page scrolling
            }
          }
        }
      };
      
      // Add the wheel event listener with passive: false to allow preventDefault when needed
      editorDomNode.addEventListener('wheel', handleWheelEvent, { passive: true });
    }
  };

  const executeCode = useCallback(async (retryCount = 0) => {
    if (!code.trim()) {
      setError('Please enter some Python code to execute');
      return;
    }

    setIsRunning(true);
    setError(null);
    setOutput('⚡ Executing your code...');

    try {
      const startTime = performance.now();
      const codeExecution = {
        code,
        exerciseId: 'learning-terminal', // Special ID for learning terminals
        runTests: false
      };

      const result = await executionApi.runCode(codeExecution);
      const executionTime = Math.round(performance.now() - startTime);
      
      if (result.success) {
        const cleanOutput = result.output?.trim();
        if (cleanOutput) {
          // Add execution time for performance feedback
          const timeMsg = executionTime < 100 ? '⚡ Super fast!' : 
                         executionTime < 500 ? '🚀 Quick execution' : 
                         executionTime < 2000 ? '✅ Done' : '⏳ Completed';
          setOutput(`${cleanOutput}\n\n${timeMsg} (${executionTime}ms)`);
        } else {
          setOutput(`✅ Code executed successfully (no output) - ${executionTime}ms`);
        }
        setError(null);
      } else {
        const errorMsg = result.errors?.trim();
        setError(errorMsg || 'An error occurred during execution');
        setOutput('');
      }
    } catch (err: unknown) {
      console.error('Code execution error:', err);
      
      // Check if it's a network error and retry
      const error = err as Error & { code?: string };
      const isNetworkError = error.message?.includes('Network Error') || 
                            error.message?.includes('ERR_FAILED') ||
                            error.code === 'ERR_NETWORK';
      
      if (isNetworkError && retryCount < 2) { // Reduced from 3 to 2 retries
        // Auto-retry with shorter delay
        const delay = Math.pow(1.5, retryCount) * 1000; // 1s, 1.5s instead of exponential
        setOutput(`🔄 Connection failed, retrying in ${Math.round(delay/1000)}s... (${retryCount + 1}/2)`);
        
        setTimeout(() => {
          executeCode(retryCount + 1);
        }, delay);
        return;
      }
      
      if (isNetworkError) {
        setError('❌ Cannot connect to Python server. Please make sure the backend is running.');
        setOutput('💡 Tip: Try running: .\\start-portal.ps1');
      } else {
        setError(error.message || 'Failed to execute code. Please try again.');
        setOutput('');
      }
    } finally {
      if (retryCount === 0) { // Only set running to false for the original call
        setIsRunning(false);
      }
    }
  }, [code]);

  const handleRunCode = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    executeCode(0);
  }, [executeCode]);

  const toggleMinimized = () => {
    setIsMinimized(!isMinimized);
  };

  const resetCode = () => {
    setCode(defaultCode);
    setOutput('');
    setError(null);
    if (editorRef.current) {
      editorRef.current.setValue(defaultCode);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  // Handle keyboard shortcuts only within the Monaco editor
  useEffect(() => {
    if (editorRef.current) {
      const editor = editorRef.current;
      
      // Add Monaco editor command for Ctrl+Enter
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        handleRunCode();
      });
      
      // Add keydown listener specifically to the Monaco editor DOM element
      const editorDomNode = editor.getDomNode();
      if (editorDomNode) {
        const handleEditorKeyDown = (e: KeyboardEvent) => {
          if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            handleRunCode();
          }
        };
        
        editorDomNode.addEventListener('keydown', handleEditorKeyDown);
        
        return () => {
          editorDomNode.removeEventListener('keydown', handleEditorKeyDown);
        };
      }
    }
  }, [handleRunCode]);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      {showTitle && (
        <div 
          className={`bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 px-4 py-3 ${isMinimized ? 'cursor-pointer hover:from-gray-700 hover:to-gray-800 transition-colors' : ''}`}
          onClick={isMinimized ? toggleMinimized : undefined}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-green-100 p-1.5 rounded-lg">
                <Terminal className="text-green-600" size={16} />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">{title}</h4>
                <p className="text-xs text-gray-300">Write and run Python code instantly</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMinimized}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md hover:bg-gray-700 transition-colors text-gray-300 hover:text-white font-medium"
                title={isMinimized ? "Expand terminal" : "Minimize terminal"}
              >
                {isMinimized ? (
                  <>
                    <span className="text-xs">Expand</span>
                  </>
                ) : (
                  <>
                    <span className="text-xs">Minimize</span>
                  </>
                )}
              </button>
              <span className="text-xs text-gray-300 bg-gray-700 px-2 py-1 rounded-full font-medium">
                Ctrl+Enter to run
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Minimized state preview - Dark themed and clickable */}
      {isMinimized && (
        <div 
          className="px-4 py-4 bg-gray-900 border-t border-gray-700 cursor-pointer hover:bg-gray-800 transition-colors"
          onClick={toggleMinimized}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Terminal className="text-green-600" size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium text-sm">Python Terminal</span>
                  <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">Ready</span>
                </div>
                <span className="text-gray-400 text-sm">Click anywhere to expand and start coding</span>
              </div>
            </div>
            <div className="text-gray-400 hover:text-white transition-colors">
              <ChevronDown size={20} />
            </div>
          </div>
        </div>
      )}

      {/* Code Editor and Controls - hidden when minimized */}
      {!isMinimized && (
        <>
          {/* Code Editor */}
          <div className="relative">
        <Editor
          height={height}
          language="python"
          value={code}
          onChange={(value) => setCode(value || '')}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            fontFamily: '"Fira Code", "JetBrains Mono", "Monaco", "Menlo", monospace',
            lineNumbers: 'on',
            wordWrap: 'on',
            readOnly: readonly,
            contextmenu: false,
            scrollbar: {
              vertical: 'hidden', // Hide scrollbars for small code snippets
              horizontal: 'auto',
              handleMouseWheel: false // Disable mouse wheel capture
            },
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false
          }}
        />

        {/* Action Buttons */}
        {!readonly && (
          <div className="absolute top-2 right-2 flex gap-1">
            <button
              type="button"
              onClick={copyCode}
              className="bg-gray-700/80 hover:bg-gray-600/80 text-white p-1.5 rounded text-xs transition-colors"
              title="Copy code"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
            <button
              type="button"
              onClick={resetCode}
              className="bg-gray-700/80 hover:bg-gray-600/80 text-white p-1.5 rounded text-xs transition-colors"
              title="Reset code"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Run Button */}
      {!readonly && (
        <div className="bg-gray-800 border-t border-gray-700 px-4 py-3">
          <button
            type="button"
            onClick={handleRunCode}
            disabled={isRunning}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
          >
            {isRunning ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Running...
              </>
            ) : (
              <>
                <Play size={16} />
                Run Code
                <Zap size={14} className="text-green-200" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Output */}
      {(output || error) && (
        <div className="border-t border-gray-700">
          <div className="bg-gray-900 text-gray-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Terminal className="text-green-400" size={16} />
              <span className="text-sm font-medium text-green-400">Output:</span>
            </div>
            
            {error ? (
              <div className="text-red-400 font-mono text-sm whitespace-pre-wrap bg-red-950/20 border border-red-500/20 rounded p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-red-500">❌</span>
                  <span className="font-semibold">Execution Error</span>
                </div>
                <div className="text-red-300 leading-relaxed">{error}</div>
              </div>
            ) : (
              <div className="bg-gray-800 border border-gray-700 rounded p-3">
                {output ? (
                  <div className="font-mono text-sm">
                    {/* Format output with proper line breaks and syntax highlighting */}
                    {output.split('\n').map((line, index) => (
                      <div key={index} className="mb-1">
                        <span className="text-gray-500 text-xs mr-2 select-none">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="text-green-300">
                          {line || '\u00A0'} {/* Non-breaking space for empty lines */}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400 italic font-mono text-sm">
                    👋 Run your code to see the output here
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default EmbeddedTerminal;