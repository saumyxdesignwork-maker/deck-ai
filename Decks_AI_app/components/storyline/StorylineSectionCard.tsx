'use client'

import { useState } from 'react'
import { GripVertical, Copy, Trash2, Plus, X } from 'lucide-react'
import { StorylineSection, LayoutType } from '@/lib/fixtures'
import { LayoutSelector } from './LayoutSelector'
import { useTheme } from '@/components/controls/ThemeProvider'

interface StorylineSectionCardProps {
  section: StorylineSection
  index: number
  onUpdate: (s: StorylineSection) => void
  onDuplicate: () => void
  onDelete: () => void
  onAddBelow: () => void
  dragHandleProps?: Record<string, unknown>
  /** VL3: spine marker replaces the number badge */
  hideNumberBadge?: boolean
  /** Studio's outline review only: replaces the round "N" badge with an
   * explicit "Slide N" label above the title, so the title itself reads as
   * editable content rather than doubling as the card's own name. Classic's
   * storyline page (app/create/storyline) omits this and keeps its existing
   * number-badge-next-to-title layout. */
  slideLabel?: string
  /** Studio's outline review only: swaps the layout picker's thumbnail-style
   * buttons for a compact segmented control, visually separated from the
   * bullets above it. Classic's storyline page omits this. */
  compactLayoutPicker?: boolean
}

export function StorylineSectionCard({
  section,
  index,
  onUpdate,
  onDuplicate,
  onDelete,
  onAddBelow,
  dragHandleProps,
  hideNumberBadge,
  slideLabel,
  compactLayoutPicker,
}: StorylineSectionCardProps) {
  const [hovered, setHovered] = useState(false)
  const { vl } = useTheme()
  const isGlass = vl === '2'
  const isVL3 = vl === '3'

  // Solid background (not the translucent/glass --surface VL2/VL3 otherwise
  // use) with a dotted outline in every visual language — these cards sit
  // over an ambient/meadow background, and a glassy fill made bullet text
  // and the layout swatches behind them hard to read. In VL2's actual dark
  // theme, the card also sits ON TOP of an opaque dark panel (the outline
  // review's own solid background, or Classic's near-opaque surface-panel) —
  // Material's dark-theme elevation guidance is to make a higher surface
  // LIGHTER than what's beneath it, not the same shade, so it reads as
  // raised rather than just outlined. --surface-muted is a translucent white
  // wash in VL2, so layering it here composites into a lighter opaque card
  // over that solid parent instead of literally repeating its color.
  const cardBackground = isVL3 ? 'var(--surface-solid)' : isGlass ? 'var(--surface-muted)' : 'var(--surface)'
  const cardBorderColor = isVL3
    ? hovered ? 'var(--accent)' : 'rgba(160, 120, 90, 0.35)'
    : isGlass
    ? hovered ? 'var(--accent)' : 'rgba(255, 255, 255, 0.22)'
    : hovered ? 'var(--accent)' : 'var(--border)'

  const updateTitle = (title: string) => onUpdate({ ...section, title })
  const updateLayout = (layout: LayoutType) => onUpdate({ ...section, layout })
  const updateBullet = (id: string, text: string) =>
    onUpdate({ ...section, bullets: section.bullets.map((b) => (b.id === id ? { ...b, text } : b)) })
  const addBullet = () =>
    onUpdate({ ...section, bullets: [...section.bullets, { id: `b-${Date.now()}`, text: '' }] })
  const removeBullet = (id: string) =>
    onUpdate({ ...section, bullets: section.bullets.filter((b) => b.id !== id) })

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: cardBackground,
        // 2px so the dots actually read as dots — at 1px they blur into
        // what looks like a faint solid line. Padding is 1px smaller to
        // compensate, so the card's outer size is unchanged.
        border: `2px dotted ${cardBorderColor}`,
        // --r-card only exists under html[data-vl="3"] — the explicit
        // fallback means this can never collapse to a square corner (the
        // CSS initial value) if this card ever renders before/while that
        // attribute is out of sync with the `vl` context value.
        borderRadius: isVL3 ? 'var(--r-card, 18px)' : 'var(--r-lg)',
        padding: isVL3 ? '17px 19px' : '15px 17px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxShadow: hovered ? 'var(--sh-2)' : 'var(--sh-1)',
      }}
    >
      {/* Card header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: slideLabel ? 8 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          {/* Drag handle — only in VL1/VL2 (VL3 uses the spine marker as handle) */}
          {!isVL3 && (
            <div
              {...(dragHandleProps || {})}
              style={{
                cursor: 'grab',
                color: 'var(--text-disabled)',
                marginTop: 2,
                flexShrink: 0,
                opacity: hovered ? 1 : 0,
                transition: 'opacity 0.15s',
              }}
            >
              <GripVertical size={16} />
            </div>
          )}

          {/* Slide-number identity — either an explicit "Slide N" label (Studio's
              outline review: the card's identity, separate from its editable
              title) or the plain round number badge (Classic's storyline page,
              where the title sits right next to it). VL3 hides both in favor
              of its own spine marker. */}
          {slideLabel ? (
            <span
              style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '3px 9px',
                borderRadius: 'var(--r-pill)',
                border: '1px solid var(--accent)',
                color: 'var(--accent)',
                fontSize: 11, fontWeight: 700,
                letterSpacing: '0.02em',
                fontFamily: 'var(--font-body)',
                flexShrink: 0,
              }}
            >
              {slideLabel}
            </span>
          ) : !hideNumberBadge && (
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                border: '1.5px solid var(--accent)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {index + 1}
            </div>
          )}

          {/* Editable title — inline next to the identity marker, unless a
              slideLabel is given, in which case it moves to its own row below
              so "Slide N" (the card's identity) and the title (its editable
              content) never look like the same label. */}
          {!slideLabel && (
            <input
              value={section.title}
              onChange={(e) => updateTitle(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: isVL3 ? 15 : 14,
                fontWeight: 600,
                color: 'var(--text)',
                background: 'transparent',
                fontFamily: 'var(--font-heading)',
                padding: '2px 0',
              }}
              placeholder="Section title…"
            />
          )}

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              gap: 2,
              marginLeft: slideLabel ? 'auto' : 0,
              opacity: hovered ? 1 : 0,
              transition: 'opacity 0.15s',
            }}
          >
            {[
              { icon: Copy, title: 'Duplicate', fn: onDuplicate },
              { icon: Trash2, title: 'Delete', fn: onDelete },
              { icon: Plus, title: 'Add below', fn: onAddBelow },
            ].map(({ icon: Icon, title, fn }) => (
              <button
                key={title}
                onClick={fn}
                title={title}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: isVL3 ? 'var(--r-md)' : 'var(--r-sm)',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: title === 'Delete' ? 'var(--destructive)' : 'var(--text-muted)',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--surface-muted)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>
        </div>

        {/* Title as content — only in the slideLabel variant (see above) */}
        {slideLabel && (
          <input
            value={section.title}
            onChange={(e) => updateTitle(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--text)',
              background: 'transparent',
              fontFamily: 'var(--font-heading)',
              padding: '2px 0',
            }}
            placeholder="Slide title…"
          />
        )}
      </div>

      {/* Bullets — indented to sit under the title only when the title is
          inline next to the badge (Classic); the slideLabel variant already
          starts its own title flush left, so bullets match that. */}
      <div
        style={{
          paddingLeft: hideNumberBadge || slideLabel ? 0 : 36,
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
        }}
      >
        {section.bullets.map((bullet) => (
          <div key={bullet.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--accent)', fontSize: 12, flexShrink: 0 }}>•</span>
            <input
              value={bullet.text}
              onChange={(e) => updateBullet(bullet.id, e.target.value)}
              placeholder="Add a point…"
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: 14,
                color: 'var(--text)',
                background: 'transparent',
                fontFamily: 'var(--font-body)',
                padding: '1px 0',
              }}
            />
            {section.bullets.length > 1 && (
              <button
                onClick={() => removeBullet(bullet.id)}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-disabled)',
                  opacity: hovered ? 1 : 0,
                  transition: 'opacity 0.1s',
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--destructive)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-disabled)')}
              >
                <X size={11} />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addBullet}
          style={{
            alignSelf: 'flex-start',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 12,
            color: 'var(--text-muted)',
            padding: '2px 0',
            fontFamily: 'var(--font-body)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--accent)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
        >
          <Plus size={11} /> Add point
        </button>
      </div>

      {/* Layout selector — a distinct control area, set apart from the
          content above by a real divider (not just indentation) so it can't
          read as part of the bullet list or as a media thumbnail sitting
          under them. */}
      <div
        style={{
          paddingLeft: hideNumberBadge || slideLabel ? 0 : 36,
          ...(compactLayoutPicker && {
            paddingTop: 10,
            borderTop: '1px solid var(--divider)',
          }),
        }}
      >
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Layout
        </p>
        <LayoutSelector selected={section.layout} onChange={updateLayout} variant={compactLayoutPicker ? 'compact' : 'thumbnail'} />
      </div>
    </div>
  )
}
