'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { motionPresets } from '@/lib/motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { DeckSection, Block, AspectRatio, aspectRatioCss, LayoutType } from '@/lib/fixtures'
import { DeckThemeScope, useDeckTemplate } from '@/components/deck/DeckThemeScope'
import { resolveCoverVars } from '@/lib/deckTemplates/toCssVars'
import type { DeckTemplate } from '@/lib/deckTemplates'

interface Slide {
  id: string
  type: 'cover' | 'section'
  title: string
  subtitle?: string
  author?: string
  color?: string
  section?: DeckSection
}

interface CoverInfo {
  subtitle: string
  author: string
  color: string
}

function buildSlides(deckTitle: string, sections: DeckSection[], cover: CoverInfo): Slide[] {
  return [
    {
      id: 'cover',
      type: 'cover',
      title: deckTitle,
      subtitle: cover.subtitle,
      author: cover.author,
      color: cover.color,
    },
    ...sections.map(s => ({ id: s.id, type: 'section' as const, title: s.title, section: s })),
  ]
}

// The single canvas every slide renders at, before the whole thing gets
// uniformly scaled to fit the viewport (see `scale` below) — matches
// PreviewPane's own canvas width (see its `maxWidth: 820`) so every
// `var(--dt-*)` token pixel value already tuned for the editor applies here
// completely unchanged, rather than needing its own separately-tuned scale.
// This is what makes Present mode's proportions match the editor by
// construction instead of by coincidence.
const BASE_W = 820

// Muted secondary text color for chrome that sits OUTSIDE the slide canvas
// itself (top/bottom bars, nav dots) — the backdrop stays a fixed dark
// stage regardless of the deck's template, same as a real projector's
// bezel; only the canvas inside picks up the template's real colors.
const CHROME_TEXT_MUTED = 'rgba(255,255,255,0.72)'

function align(layout?: LayoutType): 'left' | 'center' {
  return layout === 'statement' || layout === 'closing' ? 'center' : 'left'
}

function renderBlockPreview(block: Block, layout: LayoutType | undefined, template: DeckTemplate) {
  const textAlign = align(layout)
  switch (block.type) {
    case 'heading':
      return (
        <h2
          key={block.id}
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: textAlign === 'center' ? 'var(--dt-h1, 28px)' : 'var(--dt-h2, 22px)',
            fontWeight: 'var(--dt-h-weight, 700)' as unknown as number,
            textTransform: 'var(--dt-h-case, none)' as React.CSSProperties['textTransform'],
            letterSpacing: 'var(--dt-h-track, normal)',
            color: 'var(--text)',
            textAlign,
            marginBottom: 'var(--dt-gap, 12px)',
            lineHeight: 1.25,
          }}
        >
          {block.content}
        </h2>
      )
    case 'paragraph':
      return (
        <p
          key={block.id}
          style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--dt-body, 16px)', color: 'var(--text)', textAlign, lineHeight: 1.65, marginBottom: 'var(--dt-gap, 12px)' }}
        >
          {block.content}
        </p>
      )
    case 'quote':
      return (
        <div key={block.id} style={{ marginBottom: 'var(--dt-gap, 12px)', textAlign }}>
          <span aria-hidden style={{ display: 'block', fontFamily: 'var(--font-heading)', fontSize: 36, lineHeight: 0.5, color: 'var(--accent)', opacity: 0.5, marginBottom: 6 }}>&ldquo;</span>
          <p style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', fontSize: 20, fontWeight: 500, color: 'var(--text)', lineHeight: 1.4, margin: 0 }}>{block.content}</p>
        </div>
      )
    case 'callout':
      return (
        <div key={block.id} style={{ borderLeft: '3px solid var(--accent)', paddingLeft: 18, paddingTop: 12, paddingBottom: 12, marginBottom: 'var(--dt-gap, 12px)', background: 'var(--accent-soft)', borderRadius: '0 var(--r-sm) var(--r-sm) 0' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, color: 'var(--accent)', fontWeight: 500, margin: 0 }}>{block.content}</p>
        </div>
      )
    case 'image':
      if (!block.imageUrl) return null
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={block.id}
          src={block.imageUrl}
          alt={block.alt ?? block.content}
          style={{
            width: '100%',
            height: 180,
            objectFit: 'cover',
            display: 'block',
            boxSizing: 'border-box',
            marginBottom: 'var(--dt-gap, 12px)',
            borderRadius: 'var(--dt-img-radius, var(--r-md))',
            border: 'var(--dt-img-frame, none)',
            filter: 'var(--dt-img-filter, none)',
            mixBlendMode: 'var(--dt-img-blend, normal)' as React.CSSProperties['mixBlendMode'],
          }}
        />
      )
    case 'card-group':
      if (!block.cards) return null
      return (
        <div key={block.id} style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(block.cards.length, 3)}, 1fr)`, gap: 10, marginBottom: 'var(--dt-gap, 12px)' }}>
          {block.cards.map((card, i) => (
            <div
              key={i}
              style={{
                padding: 14,
                borderRadius: 'var(--dt-card-radius, var(--r-md))',
                background: 'var(--dt-card-bg, var(--surface-muted))',
                border: 'var(--dt-card-border, 1px solid var(--border))',
                boxShadow: 'var(--dt-card-shadow, none)',
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 6 }}>{card.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 3, fontFamily: 'var(--font-body)' }}>{card.title}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--dt-stat-color, var(--accent))', fontFamily: 'var(--dt-numeric-font, var(--font-heading))' }}>{card.value}</div>
            </div>
          ))}
        </div>
      )
    default:
      return null
  }
}

interface PresentationModeProps {
  deckTitle: string
  subtitle: string
  author: string
  coverColor: string
  sections: DeckSection[]
  onClose: () => void
  aspectRatio?: AspectRatio
}

export function PresentationMode({ deckTitle, subtitle, author, coverColor, sections, onClose, aspectRatio }: PresentationModeProps) {
  const template = useDeckTemplate()
  const slides = buildSlides(deckTitle, sections, { subtitle, author, color: coverColor })
  const ratioNum = aspectRatio === '4:3' ? 4 / 3 : 16 / 9
  const baseH = BASE_W / ratioNum
  const [current, setCurrent] = useState(0)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [hideTimer, setHideTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const m = motionPresets(useReducedMotion())

  // Reserves room for the top/bar chrome (which sit OVER the canvas, not
  // beside it, but auto-hide — keeping a margin means they never overlap
  // slide content even during the brief moment they're visible) — kept as
  // plain numbers, not CSS, since the scale factor itself is computed in JS.
  const MARGIN_X = 64
  const MARGIN_Y = 96

  // The one thing that actually changes between a laptop, a maximized
  // browser window, real OS fullscreen, and a TV-sized display — everything
  // else (the canvas's own internal layout) is fixed at BASE_W×baseH and
  // just gets visually scaled by this factor, never recomputed or reflowed.
  const [viewport, setViewport] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1280,
    h: typeof window !== 'undefined' ? window.innerHeight : 720,
  }))
  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    // Safari doesn't always fire `resize` synchronously on a fullscreen
    // transition — belt and suspenders.
    document.addEventListener('fullscreenchange', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      document.removeEventListener('fullscreenchange', onResize)
    }
  }, [])
  const scale = Math.max(0.1, Math.min((viewport.w - MARGIN_X) / BASE_W, (viewport.h - MARGIN_Y) / baseH))

  // Take focus on open (so arrow keys/Esc work immediately and screen
  // readers land in the presentation), give it back on close.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    rootRef.current?.focus()
    return () => previous?.focus?.()
  }, [])

  const go = useCallback((dir: 1 | -1) => {
    setCurrent(c => Math.max(0, Math.min(slides.length - 1, c + dir)))
  }, [slides.length])

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); go(1) }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); go(-1) }
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, onClose])

  // Auto-hide controls
  const showControls = useCallback(() => {
    setControlsVisible(true)
    if (hideTimer) clearTimeout(hideTimer)
    const t = setTimeout(() => setControlsVisible(false), 2500)
    setHideTimer(t)
  }, [hideTimer])

  useEffect(() => {
    showControls()
    return () => { if (hideTimer) clearTimeout(hideTimer) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current])

  const slide = slides[current]
  const cover = template.surfaces.cover
  const coverBg = cover.kind === 'deck-color' ? slide.color : cover.background

  return (
    <motion.div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Presenting ${deckTitle}`}
      tabIndex={-1}
      onMouseMove={showControls}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: m.exit }}
      transition={m.overlay}
      style={{
        outline: 'none',
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#0A0A0B',
        display: 'flex',
        flexDirection: 'column',
        cursor: controlsVisible ? 'default' : 'none',
      }}
    >
      {/* Top bar — fades out */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)',
          zIndex: 10,
          opacity: controlsVisible ? 1 : 0,
          transition: 'opacity 0.4s ease',
          pointerEvents: controlsVisible ? 'auto' : 'none',
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-body)' }}>
          {deckTitle}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: CHROME_TEXT_MUTED, fontFamily: 'var(--font-body)' }}>
            {current + 1} / {slides.length}
          </span>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Slide content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
        onClick={e => {
          // Click right half to advance, left half to go back
          const x = (e as React.MouseEvent).clientX
          if (x > window.innerWidth / 2) go(1)
          else go(-1)
        }}
      >
        {/* The single fixed-size canvas — width/height are real pixels, not
            vw/vh or aspectRatio-derived, so every child's font-size/padding
            is a literal, unchanging number. `transform: scale` below is the
            ONLY thing that changes across viewports; it paints this same
            layout bigger or smaller without re-flowing anything inside it,
            which is exactly what keeps typography/images/spacing/positions
            moving together instead of drifting independently. */}
        <motion.div
          key={slide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, scale }}
          transition={m.content}
          style={{
            width: BASE_W,
            height: baseH,
            flexShrink: 0,
            transformOrigin: 'center center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {slide.type === 'cover' ? (
            /* Cover slide — same background/foreground rules as CoverBlock
               (deck-color vs. the template's own fixed cover), not a
               hardcoded dark treatment, so it matches the editor exactly. */
            <div
              style={{
                ...resolveCoverVars(template),
                background: coverBg,
                backgroundImage: cover.kind === 'pattern' ? cover.pattern : undefined,
                backgroundSize: cover.kind === 'pattern' ? (cover.patternSize ?? 'auto') : undefined,
                borderRadius: template.surfaces.slideRadius,
                padding: template.space.slidePad,
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
              }}
            >
              <h1
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 'var(--dt-h-weight, 700)' as unknown as number,
                  textTransform: 'var(--dt-h-case, none)' as React.CSSProperties['textTransform'],
                  letterSpacing: 'var(--dt-h-track, normal)',
                  fontSize: 32,
                  color: 'var(--dt-cover-fg)',
                  lineHeight: 1.2,
                  marginBottom: 12,
                }}
              >
                {slide.title}
              </h1>
              {slide.subtitle && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--dt-cover-fg)', opacity: 0.8, marginBottom: 24, lineHeight: 1.5 }}>
                  {slide.subtitle}
                </p>
              )}
              {slide.author && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'color-mix(in srgb, var(--dt-cover-fg) 25%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--dt-cover-fg)' }}>
                    {slide.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--dt-cover-fg)', opacity: 0.7, fontFamily: 'var(--font-body)' }}>{slide.author}</span>
                </div>
              )}
            </div>
          ) : (
            /* Section slide — DeckThemeScope is the exact same wrapper
               ContentSection uses, so background/text/card tokens are
               identical, not a parallel guess at them. */
            <DeckThemeScope
              layout={slide.section?.layout}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: template.surfaces.slideRadius,
                overflow: 'auto',
                boxShadow: '0 40px 100px rgba(0,0,0,0.5)',
              }}
            >
              {slide.section?.blocks.map(block => renderBlockPreview(block, slide.section?.layout, template))}
            </DeckThemeScope>
          )}
        </motion.div>
      </div>

      {/* Bottom nav bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: '24px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
          opacity: controlsVisible ? 1 : 0,
          transition: 'opacity 0.4s ease',
          pointerEvents: controlsVisible ? 'auto' : 'none',
        }}
      >
        <button
          onClick={e => { e.stopPropagation(); go(-1) }}
          disabled={current === 0}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            cursor: current === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: current === 0 ? 'rgba(255,255,255,0.3)' : 'white',
            transition: 'background 0.15s',
          }}
        >
          <ChevronLeft size={20} />
        </button>

        {/* Slide dots */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={e => { e.stopPropagation(); setCurrent(i) }}
              style={{
                width: i === current ? 20 : 6,
                height: 6,
                borderRadius: 999,
                background: i === current ? 'white' : 'rgba(255,255,255,0.3)',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.2s ease',
              }}
            />
          ))}
        </div>

        <button
          onClick={e => { e.stopPropagation(); go(1) }}
          disabled={current === slides.length - 1}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            cursor: current === slides.length - 1 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: current === slides.length - 1 ? 'rgba(255,255,255,0.3)' : 'white',
            transition: 'background 0.15s',
          }}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Keyboard hint */}
      <div style={{
        position: 'absolute',
        bottom: 24,
        right: 24,
        fontSize: 11,
        color: 'rgba(255,255,255,0.3)',
        fontFamily: 'var(--font-body)',
        opacity: controlsVisible ? 1 : 0,
        transition: 'opacity 0.4s',
      }}>
        ← → to navigate · ESC to exit
      </div>
    </motion.div>
  )
}
