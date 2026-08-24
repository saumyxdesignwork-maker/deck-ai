'use client'

import { useState } from 'react'
import { MousePointer2, Pencil, PenSquare, ShieldCheck, LayoutGrid, Sparkles } from 'lucide-react'

const TOOLS = [
  { key: 'select', icon: MousePointer2, label: 'Select' },
  { key: 'draw',   icon: Pencil,        label: 'Draw' },
  { key: 'edit',   icon: PenSquare,     label: 'Edit' },
] as const

const ACTIONS = [
  { key: 'verify', icon: ShieldCheck, label: 'Verify content' },
  { key: 'layout', icon: LayoutGrid,  label: 'Fix Layout' },
  { key: 'polish', icon: Sparkles,    label: 'Polish Content' },
] as const

export function PreviewToolbar() {
  const [active, setActive] = useState<string>('edit')

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
          onClick={() => setActive(key)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px',
            borderRadius: 'var(--r-pill)',
            border: 'none',
            background: active === key ? 'var(--accent-soft)' : 'transparent',
            color: active === key ? 'var(--accent)' : 'var(--text-muted)',
            fontSize: 12, fontWeight: 500, cursor: 'pointer',
            fontFamily: 'var(--font-body)', position: 'relative',
          }}
        >
          <Icon size={13} />
          {label}
          {key === 'edit' && (
            <span style={{
              position: 'absolute', top: 2, right: 2,
              width: 5, height: 5, borderRadius: '50%', background: '#E8515A',
            }} />
          )}
        </button>
      ))}

      <div style={{ width: 1, height: 16, background: 'var(--divider)', margin: '0 2px' }} />

      {ACTIONS.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px',
            borderRadius: 'var(--r-pill)',
            border: 'none', background: 'transparent',
            color: 'var(--text-muted)',
            fontSize: 12, fontWeight: 500, cursor: 'pointer',
            fontFamily: 'var(--font-body)',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
        >
          <Icon size={13} />
          {label}
        </button>
      ))}
    </div>
  )
}
