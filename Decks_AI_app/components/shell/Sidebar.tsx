'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutGrid, Clock, Folder,
  Plus, Sparkles,
} from 'lucide-react'

// Shared with Me / Favorites / Archived / Templates are hidden for now —
// no backing data or routes behind them yet.
const NAV_ITEMS = [
  { icon: LayoutGrid, label: 'All Decks', href: '#' },
  { icon: Clock, label: 'Recent', href: '#' },
]

const FOLDER_ITEMS = [
  { icon: Folder, label: 'Marketing', href: '#' },
  { icon: Folder, label: 'Product', href: '#' },
  { icon: Folder, label: 'Engineering', href: '#' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      style={{
        width: 'var(--sidebar-w)',
        flexShrink: 0,
        height: '100%',
        background: 'var(--surface-panel, var(--surface))',
        borderRight: '1px solid var(--divider)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div
        style={{
          height: 'var(--topbar-h)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          borderBottom: '1px solid var(--divider)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={14} color="white" />
          </div>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>
            DeckAI
          </span>
        </div>
      </div>

      {/* New Deck CTA */}
      <div style={{ padding: '12px 12px 8px' }}>
        <Link
          href="/create"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            width: '100%',
            padding: '8px 14px',
            borderRadius: 'var(--r-pill)',
            background: 'var(--primary)',
            color: 'var(--primary-fg)',
            fontSize: 13,
            fontWeight: 500,
            textDecoration: 'none',
            transition: 'background 0.15s',
            fontFamily: 'var(--font-body)',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--primary-hover)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'var(--primary)')}
        >
          <Plus size={15} />
          New Deck
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflow: 'auto', padding: '4px 8px' }}>
        {NAV_ITEMS.map(({ icon: Icon, label, href }) => (
          <a
            key={label}
            href={href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              padding: '7px 10px',
              borderRadius: 'var(--r-sm)',
              color: 'var(--text)',
              fontSize: 13,
              fontWeight: 400,
              textDecoration: 'none',
              transition: 'background 0.12s',
              cursor: 'pointer',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--surface-muted)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
          >
            <Icon size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            {label}
          </a>
        ))}

        {/* Folders section */}
        <div style={{ padding: '12px 10px 4px', fontSize: 11, fontWeight: 600, color: 'var(--text-disabled)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Folders
        </div>
        {FOLDER_ITEMS.map(({ icon: Icon, label, href }) => (
          <a
            key={label}
            href={href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              padding: '7px 10px',
              borderRadius: 'var(--r-sm)',
              color: 'var(--text)',
              fontSize: 13,
              fontWeight: 400,
              textDecoration: 'none',
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--surface-muted)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
          >
            <Icon size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            {label}
          </a>
        ))}
      </nav>

      {/* Bottom: settings placeholder */}
      <div
        style={{
          padding: '10px 12px',
          borderTop: '1px solid var(--divider)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 11,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          SP
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Saumy Parihar</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>saumy@growthschool.io</div>
        </div>
      </div>
    </aside>
  )
}
