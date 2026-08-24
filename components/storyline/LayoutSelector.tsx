'use client'

import { ReactElement } from 'react'
import { LayoutType, LAYOUT_OPTIONS } from '@/lib/fixtures'

// Mini SVG thumbnails for each layout type
const LAYOUT_SVGS: Record<LayoutType, ReactElement> = {
  statement: (
    <svg viewBox="0 0 40 28" fill="none" xmlns="http://www.w3.org/2000/svg" width={40} height={28}>
      <rect x="4" y="10" width="32" height="4" rx="2" fill="currentColor" opacity="0.7" />
      <rect x="8" y="17" width="24" height="2" rx="1" fill="currentColor" opacity="0.35" />
    </svg>
  ),
  'key-points': (
    <svg viewBox="0 0 40 28" fill="none" xmlns="http://www.w3.org/2000/svg" width={40} height={28}>
      <rect x="4" y="4" width="32" height="3" rx="1.5" fill="currentColor" opacity="0.7" />
      {[11, 16, 21].map((y) => (
        <g key={y}>
          <circle cx="7" cy={y + 1.5} r="1.5" fill="currentColor" opacity="0.5" />
          <rect x="11" y={y} width="24" height="3" rx="1.5" fill="currentColor" opacity="0.35" />
        </g>
      ))}
    </svg>
  ),
  'heading-media': (
    <svg viewBox="0 0 40 28" fill="none" xmlns="http://www.w3.org/2000/svg" width={40} height={28}>
      <rect x="4" y="4" width="16" height="3" rx="1.5" fill="currentColor" opacity="0.7" />
      <rect x="4" y="10" width="13" height="2" rx="1" fill="currentColor" opacity="0.35" />
      <rect x="4" y="14" width="13" height="2" rx="1" fill="currentColor" opacity="0.35" />
      <rect x="22" y="4" width="14" height="20" rx="2" fill="currentColor" opacity="0.2" />
    </svg>
  ),
  'media-text': (
    <svg viewBox="0 0 40 28" fill="none" xmlns="http://www.w3.org/2000/svg" width={40} height={28}>
      <rect x="4" y="4" width="14" height="20" rx="2" fill="currentColor" opacity="0.2" />
      <rect x="22" y="4" width="14" height="3" rx="1.5" fill="currentColor" opacity="0.7" />
      <rect x="22" y="10" width="14" height="2" rx="1" fill="currentColor" opacity="0.35" />
      <rect x="22" y="14" width="14" height="2" rx="1" fill="currentColor" opacity="0.35" />
    </svg>
  ),
  bento: (
    <svg viewBox="0 0 40 28" fill="none" xmlns="http://www.w3.org/2000/svg" width={40} height={28}>
      <rect x="4" y="4" width="32" height="3" rx="1.5" fill="currentColor" opacity="0.7" />
      <rect x="4" y="10" width="14" height="10" rx="2" fill="currentColor" opacity="0.2" />
      <rect x="21" y="10" width="7" height="10" rx="2" fill="currentColor" opacity="0.2" />
      <rect x="31" y="10" width="5" height="10" rx="2" fill="currentColor" opacity="0.2" />
    </svg>
  ),
  data: (
    <svg viewBox="0 0 40 28" fill="none" xmlns="http://www.w3.org/2000/svg" width={40} height={28}>
      <rect x="4" y="4" width="20" height="3" rx="1.5" fill="currentColor" opacity="0.7" />
      {[8, 14, 20].map((x, i) => (
        <rect key={x} x={x} y={28 - (i + 2) * 5} width="5" height={(i + 2) * 5 - 7} rx="1.5" fill="currentColor" opacity={0.2 + i * 0.1} />
      ))}
      <rect x="27" y="10" width="9" height="12" rx="2" fill="currentColor" opacity="0.2" />
    </svg>
  ),
}

interface LayoutSelectorProps {
  selected: LayoutType
  onChange: (l: LayoutType) => void
}

export function LayoutSelector({ selected, onChange }: LayoutSelectorProps) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {LAYOUT_OPTIONS.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          title={label}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            padding: '6px 8px',
            borderRadius: 'var(--r-sm)',
            border: '1.5px solid',
            borderColor: selected === id ? 'var(--accent)' : 'var(--border)',
            background: selected === id ? 'var(--accent-soft)' : 'var(--surface-muted)',
            cursor: 'pointer',
            transition: 'all 0.12s',
            color: selected === id ? 'var(--accent)' : 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
          }}
          onMouseEnter={e => {
            if (selected !== id) {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'
              ;(e.currentTarget as HTMLElement).style.background = 'var(--accent-soft)'
            }
          }}
          onMouseLeave={e => {
            if (selected !== id) {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
              ;(e.currentTarget as HTMLElement).style.background = 'var(--surface-muted)'
            }
          }}
        >
          <div style={{ color: selected === id ? 'var(--accent)' : 'var(--text-muted)' }}>
            {LAYOUT_SVGS[id]}
          </div>
          <span style={{ fontSize: 9, fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</span>
        </button>
      ))}
    </div>
  )
}
