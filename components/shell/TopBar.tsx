'use client'

import { Search, Bell, Coins } from 'lucide-react'

interface TopBarProps {
  title?: string
  showSearch?: boolean
}

export function TopBar({ title, showSearch = true }: TopBarProps) {
  return (
    <header
      style={{
        height: 'var(--topbar-h)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        borderBottom: '1px solid var(--divider)',
        background: 'var(--surface-panel, var(--surface))',
        gap: 12,
      }}
    >
      {/* Center: title or search */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {title ? (
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--text)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {title}
          </span>
        ) : showSearch ? (
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 'var(--r-pill)',
              border: '1px solid var(--border)',
              background: 'var(--surface-muted)',
              color: 'var(--text-muted)',
              fontSize: 12,
              cursor: 'pointer',
              width: 240,
              fontFamily: 'var(--font-body)',
            }}
          >
            <Search size={13} />
            Search decks…
            <span style={{ marginLeft: 'auto', fontSize: 10, background: 'var(--border)', padding: '1px 5px', borderRadius: 3 }}>
              ⌘K
            </span>
          </button>
        ) : null}
      </div>

      {/* Right cluster */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {/* Coins / Credits */}
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 10px',
            borderRadius: 'var(--r-pill)',
            border: '1px solid var(--border)',
            background: 'var(--surface-muted)',
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--text)',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
          }}
        >
          <Coins size={13} style={{ color: 'var(--warning)' }} />
          240
        </button>

        {/* Bell */}
        <button
          style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--r-sm)',
            border: 'none',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-muted)',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--surface-muted)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
        >
          <Bell size={16} />
        </button>

        {/* Avatar */}
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          SP
        </div>
      </div>
    </header>
  )
}
