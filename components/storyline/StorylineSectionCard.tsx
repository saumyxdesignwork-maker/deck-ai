'use client'

import { useState } from 'react'
import { GripVertical, Copy, Trash2, Plus, X } from 'lucide-react'
import { StorylineSection, LayoutType } from '@/lib/fixtures'
import { LayoutSelector } from './LayoutSelector'
import { useGlassCard } from '@/lib/useGlassCard'
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
}: StorylineSectionCardProps) {
  const [hovered, setHovered] = useState(false)
  const glassClass = useGlassCard()
  const { vl } = useTheme()
  const isGlass = vl === '2'
  const isVL3 = vl === '3'

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
      className={isGlass ? glassClass : undefined}
      style={{
        background: isVL3
          ? 'rgba(255, 251, 247, 0.72)'
          : isGlass
          ? undefined
          : 'var(--surface)',
        border: isVL3
          ? '1px solid rgba(160,120,90,0.14)'
          : isGlass
          ? 'none'
          : '1px solid',
        borderColor: isVL3
          ? undefined
          : isGlass
          ? undefined
          : hovered
          ? 'var(--accent)'
          : 'var(--border)',
        borderRadius: isVL3 ? 'var(--r-card)' : 'var(--r-lg)',
        padding: isVL3 ? '18px 20px' : '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxShadow: isVL3
          ? hovered
            ? 'var(--sh-2)'
            : 'var(--sh-1)'
          : isGlass
          ? undefined
          : 'var(--sh-1)',
        backdropFilter: isVL3 ? 'blur(12px) saturate(140%)' : undefined,
        WebkitBackdropFilter: isVL3 ? 'blur(12px) saturate(140%)' : undefined,
      }}
    >
      {/* Card header */}
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

        {/* Number badge — hidden in VL3 (spine marker handles it) */}
        {!hideNumberBadge && (
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

        {/* Editable title */}
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

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: 2,
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

      {/* Bullets */}
      <div
        style={{
          paddingLeft: hideNumberBadge ? 0 : 36,
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

      {/* Layout selector */}
      <div style={{ paddingLeft: hideNumberBadge ? 0 : 36 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Layout
        </p>
        <LayoutSelector selected={section.layout} onChange={updateLayout} />
      </div>
    </div>
  )
}
