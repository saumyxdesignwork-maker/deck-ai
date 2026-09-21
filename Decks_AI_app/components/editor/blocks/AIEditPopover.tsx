'use client'

import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'

const QUICK_ACTIONS = ['Polish', 'Make longer', 'Make shorter', 'Verify']

interface AIEditPopoverProps {
  onSubmit: (instruction: string) => void
  onCancel: () => void
  isLoading: boolean
}

/** Anchored just below a single selected block in Select mode — lets the
 * user describe a change in plain language, or pick a quick action, and
 * the AI rewrites that block's text in place. Fixed dark palette (not
 * theme CSS vars) so it reads as a distinct "AI action" surface regardless
 * of the app's light/dark/warm theme, same reasoning as PresentationMode. */
export function AIEditPopover({ onSubmit, onCancel, isLoading }: AIEditPopoverProps) {
  const [text, setText] = useState('')

  const submit = (instruction: string) => {
    if (!instruction.trim() || isLoading) return
    onSubmit(instruction)
    setText('')
  }

  return (
    <div
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        left: 0,
        zIndex: 20,
        width: 260,
        background: '#1C1B1A',
        borderRadius: 16,
        padding: 12,
        boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
      }}
    >
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            submit(text)
          }
        }}
        placeholder="What should change about this Text Box?"
        rows={2}
        disabled={isLoading}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          resize: 'none',
          color: 'rgba(255,255,255,0.94)',
          fontSize: 13,
          fontFamily: 'var(--font-body)',
          lineHeight: 1.4,
          marginBottom: 10,
          boxSizing: 'border-box',
        }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
        {QUICK_ACTIONS.map(action => (
          <button
            key={action}
            onClick={() => submit(action)}
            disabled={isLoading}
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--r-pill)',
              border: '1px solid rgba(255,255,255,0.18)',
              background: 'transparent',
              color: 'rgba(255,255,255,0.85)',
              fontSize: 12,
              fontWeight: 500,
              cursor: isLoading ? 'wait' : 'pointer',
              fontFamily: 'var(--font-body)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            onMouseEnter={e => { if (!isLoading) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)' }}
            onMouseLeave={e => { if (!isLoading) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            {action}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={onCancel}
          disabled={isLoading}
          style={{
            border: 'none', background: 'transparent',
            color: 'rgba(255,255,255,0.6)', fontSize: 13,
            cursor: isLoading ? 'wait' : 'pointer', fontFamily: 'var(--font-body)',
            padding: '4px 6px',
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => submit(text)}
          disabled={isLoading || !text.trim()}
          style={{
            width: 28, height: 28, borderRadius: '50%',
            border: 'none',
            background: isLoading || !text.trim() ? 'rgba(255,255,255,0.2)' : 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: isLoading ? 'wait' : text.trim() ? 'pointer' : 'not-allowed',
            flexShrink: 0,
          }}
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" color="#1C1B1A" /> : <Check size={14} color="#1C1B1A" />}
        </button>
      </div>
    </div>
  )
}
