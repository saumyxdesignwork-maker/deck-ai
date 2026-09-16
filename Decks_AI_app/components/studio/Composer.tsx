'use client'

import { useEffect, useRef, useState, KeyboardEvent } from 'react'
import { Plus, Mic, ArrowUp, ChevronDown, Upload, FolderOpenDot } from 'lucide-react'

// Simple three-tone Drive mark — no brand asset dependency, just a recognizable shape.
// Accepts the same size/style props as the lucide icons it sits alongside in ATTACH_OPTIONS.
function GoogleDriveIcon({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style}>
      <path d="M8.1 2.5 1 14.6l3.1 5.4h6.4l-3.1-5.4z" fill="#4285F4" />
      <path d="M15.9 2.5H8.1l6.4 11.1h7.8z" fill="#FBBC04" />
      <path d="M17.2 20h6.4l-3.1-5.4h-6.4z" fill="#34A853" />
    </svg>
  )
}

const ATTACH_OPTIONS = [
  { key: 'local', icon: Upload, label: 'Browse Local Files' },
  { key: 'ai-drive', icon: FolderOpenDot, label: 'Choose from AI Drive' },
  { key: 'google-drive', icon: GoogleDriveIcon, label: 'Choose from Google Drive' },
] as const

interface ComposerProps {
  onSubmit: (text: string) => void
  placeholder?: string
  variant?: 'hero' | 'session'
  disabled?: boolean
  /** Controlled input — pass both to let a parent (e.g. a template click) fill the field. */
  value?: string
  onChange?: (value: string) => void
}

export function Composer({ onSubmit, placeholder = 'Enter your slides request here', variant = 'session', disabled, value: controlledValue, onChange: controlledOnChange }: ComposerProps) {
  const [internalValue, setInternalValue] = useState('')
  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : internalValue
  const setValue = (v: string) => {
    if (isControlled) controlledOnChange?.(v)
    else setInternalValue(v)
  }
  const [model, setModel] = useState<'Standard' | 'Ultra'>('Standard')
  const [attachOpen, setAttachOpen] = useState(false)
  const attachRef = useRef<HTMLDivElement>(null)
  const isHero = variant === 'hero'

  useEffect(() => {
    if (!attachOpen) return
    const handler = (e: MouseEvent) => {
      if (attachRef.current && !attachRef.current.contains(e.target as Node)) setAttachOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [attachOpen])

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
        <div ref={attachRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setAttachOpen(o => !o)}
            style={{
              width: 28, height: 28, borderRadius: '50%',
              border: '1px solid var(--border)',
              background: attachOpen ? 'var(--accent-soft)' : 'var(--surface-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: attachOpen ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0,
            }}
            title="Attach"
          >
            <Plus size={14} style={{ transform: attachOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.12s' }} />
          </button>

          {attachOpen && (
            <div
              className="animate-slide-up"
              style={{
                position: 'absolute',
                bottom: '100%',
                left: 0,
                marginBottom: 8,
                minWidth: 210,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                boxShadow: 'var(--sh-3)',
                padding: 4,
                zIndex: 20,
              }}
            >
              {ATTACH_OPTIONS.map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setAttachOpen(false)}
                  style={{
                    width: '100%',
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px',
                    borderRadius: 'var(--r-sm)',
                    border: 'none', background: 'transparent',
                    cursor: 'pointer', textAlign: 'left',
                    fontSize: 13, color: 'var(--text)',
                    fontFamily: 'var(--font-body)',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--surface-muted)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                >
                  <Icon size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

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
