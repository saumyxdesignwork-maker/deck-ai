'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Palette, Play, MoreHorizontal, Users } from 'lucide-react'

interface EditorTopBarProps {
  title: string
  onTitleChange: (t: string) => void
  onPresent: () => void
}

export function EditorTopBar({ title, onTitleChange, onPresent }: EditorTopBarProps) {
  const router = useRouter()

  return (
    <div
      style={{
        height: 'var(--topbar-h)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        borderBottom: '1px solid var(--divider)',
        background: 'var(--surface-panel, var(--surface))',
        gap: 8,
      }}
    >
      {/* Back */}
      <button
        onClick={() => router.push('/create/storyline')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '5px 10px',
          borderRadius: 'var(--r-sm)',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          fontSize: 13,
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-body)',
          flexShrink: 0,
        }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--surface-muted)')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
      >
        <ArrowLeft size={15} />
        Back
      </button>

      {/* Breadcrumb */}
      <span style={{ fontSize: 12, color: 'var(--text-disabled)' }}>My Decks /</span>

      {/* Editable title */}
      <input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          fontSize: 14,
          fontWeight: 500,
          color: 'var(--text)',
          background: 'transparent',
          fontFamily: 'var(--font-body)',
          textAlign: 'center',
          padding: '4px 8px',
          borderRadius: 'var(--r-sm)',
          transition: 'background 0.12s',
        }}
        onFocus={e => (e.target.style.background = 'var(--surface-muted)')}
        onBlur={e => (e.target.style.background = 'transparent')}
      />

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        {/* Collaborator avatar */}
        <div style={{ display: 'flex', marginRight: 4 }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 10, fontWeight: 700,
            border: '2px solid var(--surface)',
          }}>SP</div>
        </div>

        {/* Theme / Share — placeholder */}
        {[
          { icon: Palette, label: 'Theme' },
          { icon: Users,   label: 'Share' },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            title={label}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px',
              borderRadius: 'var(--r-sm)',
              border: '1px solid var(--border)',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 12,
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-body)',
              transition: 'all 0.12s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              el.style.background = 'var(--surface-muted)'
              el.style.color = 'var(--text)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.background = 'transparent'
              el.style.color = 'var(--text-muted)'
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}

        {/* Present CTA — fully functional */}
        <button
          onClick={onPresent}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 16px',
            borderRadius: 'var(--r-pill)',
            border: 'none',
            background: 'var(--primary)',
            color: 'var(--primary-fg)',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'var(--font-body)',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          title="Present"
        >
          <Play size={13} fill="currentColor" />
          Present
        </button>

        <button
          style={{
            width: 30, height: 30,
            borderRadius: 'var(--r-sm)',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--surface-muted)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
        >
          <MoreHorizontal size={16} />
        </button>
      </div>
    </div>
  )
}
