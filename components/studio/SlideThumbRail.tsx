'use client'

import { MOCK_DECK } from '@/lib/fixtures'
import { TOTAL_SLIDES } from '@/lib/studioScript'

interface SlideThumbRailProps {
  revealedSlides: number[]
  activeIndex: number | null
  onSelect: (index: number) => void
}

function slideTitle(index: number) {
  if (index === 0) return 'Cover'
  return MOCK_DECK.sections[index - 1]?.title ?? ''
}

function slideColor(index: number) {
  if (index === 0) return MOCK_DECK.coverColor
  return MOCK_DECK.sections[index - 1]?.thumbnailColor ?? 'var(--surface-muted)'
}

export function SlideThumbRail({ revealedSlides, activeIndex, onSelect }: SlideThumbRailProps) {
  const slots = Array.from({ length: TOTAL_SLIDES }, (_, i) => i)

  return (
    <div
      style={{
        width: 96,
        flexShrink: 0,
        borderRight: '1px solid var(--divider)',
        overflow: 'auto',
        padding: '10px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {slots.map(i => {
        const revealed = revealedSlides.includes(i)
        const isActive = activeIndex === i
        return (
          <button
            key={i}
            onClick={() => revealed && onSelect(i)}
            disabled={!revealed}
            title={revealed ? slideTitle(i) : undefined}
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16 / 10',
              borderRadius: 'var(--r-sm)',
              border: '1.5px solid',
              borderColor: isActive ? 'var(--accent)' : 'var(--border)',
              background: revealed ? slideColor(i) : 'var(--surface-muted)',
              cursor: revealed ? 'pointer' : 'default',
              padding: 0,
              overflow: 'hidden',
              transition: 'border-color 0.12s',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: 3, left: 4,
                fontSize: 9, fontWeight: 700,
                color: revealed ? 'rgba(255,255,255,0.85)' : 'var(--text-disabled)',
              }}
            >
              {i + 1}
            </span>
            {!revealed && (
              <div className="animate-pulse" style={{ position: 'absolute', inset: 4, background: 'var(--border)', borderRadius: 3, opacity: 0.4 }} />
            )}
          </button>
        )
      })}
    </div>
  )
}
