import { useRef, useEffect } from 'react'
import * as monaco from 'monaco-editor'

interface MonacoEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  theme?: string
  options?: monaco.editor.IStandaloneEditorConstructionOptions
  height?: string
}

export const MonacoEditor = ({
  value,
  onChange,
  language = 'python',
  theme = 'vs-light',
  options = {},
  height = '100%'
}: MonacoEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const editorInstanceRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

  useEffect(() => {
    if (!editorRef.current) return

    // Create editor instance
    editorInstanceRef.current = monaco.editor.create(editorRef.current, {
      value,
      language,
      theme,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      minimap: { enabled: false },
      fontSize: 14,
      tabSize: 4,
      insertSpaces: true,
      wordWrap: 'on',
      lineNumbers: 'on',
      folding: true,
      bracketPairColorization: { enabled: true },
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnEnter: 'on',
      quickSuggestions: true,
      ...options
    })

    // Set up change listener
    const changeListener = editorInstanceRef.current.onDidChangeModelContent(() => {
      const currentValue = editorInstanceRef.current?.getValue() || ''
      onChange(currentValue)
    })

    // Allow page scrolling when mouse is over Monaco editor
    const editorDomNode = editorInstanceRef.current.getDomNode();
    let wheelCleanup: (() => void) | null = null;

    if (editorDomNode) {
      const editorElement = editorDomNode.querySelector('.monaco-scrollable-element');
      if (editorElement) {
        const handleWheel = (e: Event) => {
          const wheelEvent = e as WheelEvent;
          const { scrollTop, scrollHeight, clientHeight } = editorElement as HTMLElement;
          const atTop = scrollTop === 0;
          const atBottom = scrollTop + clientHeight >= scrollHeight - 1;

          // Allow page scroll when editor can't scroll in that direction
          if ((wheelEvent.deltaY < 0 && atTop) || (wheelEvent.deltaY > 0 && atBottom)) {
            // Let the event bubble up to allow page scrolling
            return;
          }

          // Prevent page scroll when editor is handling the scroll
          e.stopPropagation();
        };

        editorElement.addEventListener('wheel', handleWheel, { passive: false });

        wheelCleanup = () => {
          editorElement.removeEventListener('wheel', handleWheel);
        };
      }
    }

    // Configure Python language features
    monaco.languages.setLanguageConfiguration('python', {
      brackets: [
        ['(', ')'],
        ['[', ']'],
        ['{', '}']
      ],
      autoClosingPairs: [
        { open: '(', close: ')' },
        { open: '[', close: ']' },
        { open: '{', close: '}' },
        { open: '"', close: '"', notIn: ['string'] },
        { open: "'", close: "'", notIn: ['string', 'comment'] }
      ],
      indentationRules: {
        increaseIndentPattern: /^\s*(def|class|if|elif|else|for|while|try|except|finally|with)\b.*:$/,
        decreaseIndentPattern: /^\s*(return|break|continue|pass)\b/
      }
    })

    // Cleanup
    return () => {
      wheelCleanup?.();
      changeListener.dispose()
      editorInstanceRef.current?.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update editor value when prop changes
  useEffect(() => {
    if (editorInstanceRef.current && editorInstanceRef.current.getValue() !== value) {
      editorInstanceRef.current.setValue(value)
    }
  }, [value])

  // Update theme
  useEffect(() => {
    if (editorInstanceRef.current) {
      monaco.editor.setTheme(theme)
    }
  }, [theme])

  return (
    <div
      ref={editorRef}
      style={{ height: height, width: '100%' }}
      className="monaco-editor-container"
    />
  )
}