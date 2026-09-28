'use client'

import { useEffect, useState } from 'react'
import { AspectRatio, aspectRatioCss } from '@/lib/fixtures'
import { useDeckTemplate, CornerMarks } from '@/components/deck/DeckThemeScope'
import { resolveCoverVars } from '@/lib/deckTemplates/toCssVars'

interface CoverBlockProps {
  title: string
  subtitle: string
  author: string
  coverColor: string
  /** Locks the slide's shape (defaults to 16:9 for callers that predate
   * this, e.g. Classic's MOCK_DECK) — content is clipped to fit, never
   * allowed to push the slide taller than its ratio. */
  aspectRatio?: AspectRatio
}

export function CoverBlock({ title, subtitle, author, coverColor, aspectRatio }: CoverBlockProps) {
  const [editTitle, setEditTitle] = useState(title)
  const [editSubtitle, setEditSubtitle] = useState(subtitle)
  const template = useDeckTemplate()
  const cover = template.surfaces.cover

  // These fields aren't wired to persist local typing anywhere yet (a
  // pre-existing gap, not new here) — but they must at least reflect an
  // externally-changed deck (e.g. an agent edit via POST /edit, or a fresh
  // streamed deck), otherwise this local state permanently shadows the real
  // title/subtitle the moment it mounts.
  useEffect(() => setEditTitle(title), [title])
  useEffect(() => setEditSubtitle(subtitle), [subtitle])

  // 'deck-color' keeps using the deck's own generated coverColor (the
  // default Meridian template, and every deck saved before templates
  // existed) — every other kind uses the template's own fixed background,
  // since a template with a deliberate palette shouldn't have that
  // overridden by an LLM-picked hex.
  const background = cover.kind === 'deck-color' ? coverColor : cover.background

  return (
    <div
      style={{
        ...resolveCoverVars(template),
        background,
        borderRadius: template.surfaces.slideRadius,
        padding: template.space.slidePad,
        marginBottom: 12,
        position: 'relative',
        overflow: 'hidden',
        aspectRatio: aspectRatioCss(aspectRatio),
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        boxSizing: 'border-box',
      }}
    >
      {/* Background overlay — the template's own halftone/pattern when it
          has one, otherwise a generic depth gradient (Meridian's look). */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: cover.kind === 'pattern' ? cover.pattern : 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%, rgba(0,0,0,0.2) 100%)',
          // Only patterns tile — the depth gradient fallback is a single
          // full-cover sweep and must keep its default (cover) sizing.
          backgroundSize: cover.kind === 'pattern' ? (cover.patternSize ?? 'auto') : undefined,
          pointerEvents: 'none',
        }}
      />

      {template.surfaces.cornerMarks && <CornerMarks color="var(--dt-cover-fg)" />}

      {/* Cover type badge */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          padding: '3px 10px',
          borderRadius: 'var(--r-pill)',
          background: 'color-mix(in srgb, var(--dt-cover-fg) 20%, transparent)',
          fontSize: 10,
          fontWeight: 600,
          color: 'color-mix(in srgb, var(--dt-cover-fg) 80%, transparent)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        Cover
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          style={{
            display: 'block',
            width: '100%',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontFamily: 'var(--font-heading)',
            fontSize: 32,
            fontWeight: 'var(--dt-h-weight, 700)' as unknown as number,
            textTransform: 'var(--dt-h-case, none)' as React.CSSProperties['textTransform'],
            letterSpacing: 'var(--dt-h-track, normal)',
            color: 'var(--dt-cover-fg)',
            lineHeight: 1.2,
            marginBottom: 12,
            padding: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          placeholder="Deck title"
        />
        <input
          value={editSubtitle}
          onChange={(e) => setEditSubtitle(e.target.value)}
          style={{
            display: 'block',
            width: '100%',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontFamily: 'var(--font-body)',
            fontSize: 15,
            color: 'color-mix(in srgb, var(--dt-cover-fg) 80%, transparent)',
            padding: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginBottom: 24,
          }}
          placeholder="Subtitle…"
        />
        <div
          style={{
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
              background: 'color-mix(in srgb, var(--dt-cover-fg) 25%, transparent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--dt-cover-fg)',
            }}
          >
            {author.split(' ').map(w => w[0]).join('').slice(0, 2)}
          </div>
          <span style={{ fontSize: 12, color: 'color-mix(in srgb, var(--dt-cover-fg) 70%, transparent)', fontFamily: 'var(--font-body)' }}>
            {author}
          </span>
        </div>
      </div>
    </div>
  )
}
