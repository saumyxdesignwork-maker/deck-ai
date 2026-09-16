'use client'

import { useEffect, useRef, useState } from 'react'

interface ReasoningTextProps {
  text: string
}

// Character-streamed reasoning text — mirrors the prompt-kit Reasoning
// pattern (type the trace out, then it sits still), but as plain content:
// the collapsible trigger/border chrome is supplied by the parent
// ChainOfThoughtBlock this renders inside.
export function ReasoningText({ text }: ReasoningTextProps) {
  const [revealed, setRevealed] = useState('')
  const doneRef = useRef(false)

  useEffect(() => {
    let i = 0
    doneRef.current = false
    setRevealed('')
    const interval = setInterval(() => {
      i += 3
      setRevealed(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(interval)
        doneRef.current = true
      }
    }, 14)
    return () => clearInterval(interval)
  }, [text])

  const isStreaming = revealed.length < text.length

  return (
    <div
      style={{
        fontSize: 12,
        color: 'var(--text-muted)',
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        fontFamily: 'var(--font-body)',
      }}
    >
      {revealed}
      {isStreaming && (
        <span
          style={{
            display: 'inline-block',
            width: 5, height: 12,
            marginLeft: 2,
            background: 'var(--text-muted)',
            animation: 'studio-blink 0.8s ease-in-out infinite',
            verticalAlign: 'text-bottom',
          }}
        />
      )}
    </div>
  )
}
