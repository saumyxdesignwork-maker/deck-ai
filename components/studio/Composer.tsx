'use client'

import { useState, KeyboardEvent } from 'react'
import { Plus, Mic, ArrowUp, ChevronDown } from 'lucide-react'

interface ComposerProps {
  onSubmit: (text: string) => void
  placeholder?: string
  variant?: 'hero' | 'session'
  disabled?: boolean
}

export function Composer({ onSubmit, placeholder = 'Enter your slides request here', variant = 'session', disabled }: ComposerProps) {
  const [value, setValue] = useState('')
  const [model, setModel] = useState<'Standard' | 'Ultra'>('Standard')
  const isHero = variant === 'hero'

  const submit = () => {
    if (!value.trim() || disabled) return
    onSubmit(value.trim())
    setValue('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: isHero ? 'var(--r-xl)' : 'var(--r-lg)',
        boxShadow: isHero ? 'var(--sh-2)' : 'var(--sh-1)',
        padding: isHero ? '16px 18px 12px' : '10px 12px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={isHero ? 2 : 1}
        style={{
          border: 'none',
          outline: 'none',
          resize: 'none',
          background: 'transparent',
          fontFamily: 'var(--font-body)',
          fontSize: isHero ? 15 : 13,
          color: 'var(--text)',
          lineHeight: 1.5,
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          style={{
            width: 28, height: 28, borderRadius: '50%',
            border: '1px solid var(--border)', background: 'var(--surface-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0,
          }}
          title="Attach"
        >
          <Plus size={14} />
        </button>

        <button
          onClick={() => setModel(m => (m === 'Standard' ? 'Ultra' : 'Standard'))}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 'var(--r-pill)',
            border: '1px solid var(--border)', background: 'var(--surface-muted)',
            fontSize: 12, fontWeight: 500, color: 'var(--text)',
            cursor: 'pointer', fontFamily: 'var(--font-body)',
          }}
        >
          {model}
          <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
        </button>

        <div style={{ flex: 1 }} />

        <button
          style={{
            width: 28, height: 28, borderRadius: '50%',
            border: 'none', background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0,
          }}
          title="Voice input"
        >
          <Mic size={15} />
        </button>

        <button
          onClick={submit}
          disabled={!value.trim() || disabled}
          style={{
            width: 30, height: 30, borderRadius: '50%',
            border: 'none',
            background: value.trim() && !disabled ? 'var(--primary)' : 'var(--surface-muted)',
            color: value.trim() && !disabled ? 'var(--primary-fg)' : 'var(--text-disabled)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: value.trim() && !disabled ? 'pointer' : 'not-allowed',
            flexShrink: 0, transition: 'background 0.15s',
          }}
          title="Send"
        >
          <ArrowUp size={15} />
        </button>
      </div>
    </div>
  )
}
