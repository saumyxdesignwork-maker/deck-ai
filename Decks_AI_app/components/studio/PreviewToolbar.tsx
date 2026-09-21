'use client'

import { MousePointer2, PenSquare, ShieldCheck, Loader2 } from 'lucide-react'

const TOOLS = [
  { key: 'select', icon: MousePointer2, label: 'Select' },
  { key: 'edit',   icon: PenSquare,     label: 'Edit' },
] as const

export type CanvasMode = typeof TOOLS[number]['key']

interface PreviewToolbarProps {
  mode: CanvasMode
  onModeChange: (mode: CanvasMode) => void
  onVerify: () => void
  isVerifying: boolean
  flagCount: number | null
}

export function PreviewToolbar({ mode, onModeChange, onVerify, isVerifying, flagCount }: PreviewToolbarProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 14,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: 4,
        borderRadius: 'var(--r-pill)',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--sh-2)',
        zIndex: 15,
      }}
    >
      {TOOLS.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          onClick={() => onModeChange(key)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px',
            borderRadius: 'var(--r-pill)',
            border: 'none',
            background: mode === key ? 'var(--accent-soft)' : 'transparent',
            color: mode === key ? 'var(--accent)' : 'var(--text-muted)',
            fontSize: 12, fontWeight: 500, cursor: 'pointer',
            fontFamily: 'var(--font-body)', position: 'relative',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          <Icon size={13} style={{ flexShrink: 0 }} />
          {label}
        </button>
      ))}

      <div style={{ width: 1, height: 16, background: 'var(--divider)', margin: '0 2px' }} />

      <button
        onClick={onVerify}
        disabled={isVerifying}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 10px',
          borderRadius: 'var(--r-pill)',
          border: 'none', background: 'transparent',
          color: 'var(--text-muted)',
          fontSize: 12, fontWeight: 500, cursor: isVerifying ? 'wait' : 'pointer',
          fontFamily: 'var(--font-body)', position: 'relative',
          whiteSpace: 'nowrap', flexShrink: 0,
        }}
        onMouseEnter={e => { if (!isVerifying) (e.currentTarget as HTMLElement).style.color = 'var(--text)' }}
        onMouseLeave={e => { if (!isVerifying) (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}
      >
        {isVerifying ? <Loader2 size={13} className="animate-spin" style={{ flexShrink: 0 }} /> : <ShieldCheck size={13} style={{ flexShrink: 0 }} />}
        {isVerifying ? 'Verifying…' : 'Verify content'}
        {!isVerifying && flagCount !== null && flagCount > 0 && (
          <span style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minWidth: 15, height: 15, padding: '0 3px', borderRadius: '50%',
            background: '#E8963C', color: 'white', fontSize: 9.5, fontWeight: 700,
          }}>
            {flagCount}
          </span>
        )}
      </button>
    </div>
  )
}
