'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { motionPresets } from '@/lib/motion'
import { X, ChevronLeft, ChevronRight, Minimize2 } from 'lucide-react'
import { DeckSection, Block, AspectRatio, aspectRatioCss } from '@/lib/fixtures'

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

// Presentation mode always renders on its own fixed dark backdrop,
// regardless of the site's active VL1/VL2/VL3 theme — so these colors are
// hardcoded for legibility on dark, never the `--text`/`--accent` theme
// variables (those are tuned for light surfaces and were the cause of
// dark-text-on-dark-panel illegibility here before).
const PRESENT_TEXT = 'rgba(255,255,255,0.94)'
const PRESENT_TEXT_MUTED = 'rgba(255,255,255,0.72)'
const PRESENT_ACCENT = '#F2A65A'

function renderBlockPreview(block: Block) {
  switch (block.type) {
    case 'heading':
      return (
        <h2 key={block.id} style={{ fontFamily: 'var(--font-heading)', fontSize: 34, fontWeight: 700, color: PRESENT_TEXT, marginBottom: 16, lineHeight: 1.2 }}>
          {block.content}
        </h2>
      )
    case 'paragraph':
      return (
        <p key={block.id} style={{ fontFamily: 'var(--font-body)', fontSize: 19, color: PRESENT_TEXT_MUTED, lineHeight: 1.65, marginBottom: 18 }}>
          {block.content}
        </p>
      )
    case 'callout':
      return (
        <div key={block.id} style={{ borderLeft: `3px solid ${PRESENT_ACCENT}`, paddingLeft: 18, paddingTop: 12, paddingBottom: 12, marginBottom: 18, background: 'rgba(242,166,90,0.12)', borderRadius: '0 var(--r-sm) var(--r-sm) 0' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, color: PRESENT_ACCENT, fontWeight: 500, margin: 0 }}>{block.content}</p>
        </div>
      )
    case 'card-group':
      if (!block.cards) return null
      return (
        <div key={block.id} style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(block.cards.length, 3)}, 1fr)`, gap: 14, marginBottom: 18 }}>
          {block.cards.map((card, i) => (
            <div key={i} style={{ padding: 18, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--r-md)' }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{card.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: PRESENT_TEXT_MUTED, marginBottom: 4 }}>{card.title}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: PRESENT_TEXT }}>{card.value}</div>
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
  const slides = buildSlides(deckTitle, sections, { subtitle, author, color: coverColor })
  // Numeric form of the same ratio aspectRatioCss() renders as CSS — used to
  // size the slide as large as possible without exceeding the viewport in
  // either dimension (a real "fill the screen" present view, not a small
  // fixed-width card floating in the middle of it).
  const ratioNum = aspectRatio === '4:3' ? 4 / 3 : 16 / 9
  const [current, setCurrent] = useState(0)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [hideTimer, setHideTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const m = motionPresets(useReducedMotion())

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
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-body)' }}>
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
          padding: '32px',
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
        <div
          className="animate-fade-in"
          key={slide.id}
          style={{
            // Fills as much of the viewport as possible while honoring the
            // deck's aspect ratio exactly — whichever dimension (width or
            // height) is the tighter constraint wins, so the slide is
            // always maximally large without ever being cropped or
            // letterboxed unevenly.
            width: `min(100%, calc((100vh - 64px) * ${ratioNum}))`,
            aspectRatio: aspectRatioCss(aspectRatio),
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {slide.type === 'cover' ? (
            /* Cover slide */
            <div
              style={{
                background: slide.color,
                borderRadius: 'var(--r-xl)',
                padding: '60px 64px',
                aspectRatio: aspectRatioCss(aspectRatio),
                overflow: 'hidden',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
              }}
            >
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 44, fontWeight: 700, color: 'rgba(255,255,255,0.95)', lineHeight: 1.15, marginBottom: 14 }}>
                {slide.title}
              </h1>
              {slide.subtitle && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 18, color: 'rgba(255,255,255,0.65)', marginBottom: 28, lineHeight: 1.5 }}>
                  {slide.subtitle}
                </p>
              )}
              {slide.author && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white' }}>
                    {slide.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-body)' }}>{slide.author}</span>
                </div>
              )}
            </div>
          ) : (
            /* Section slide */
            <div
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 'var(--r-xl)',
                padding: '52px 60px',
                aspectRatio: aspectRatioCss(aspectRatio),
                overflow: 'auto',
                boxSizing: 'border-box',
                boxShadow: '0 40px 100px rgba(0,0,0,0.5)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              {slide.section?.blocks.map(block => renderBlockPreview(block))}
            </div>
          )}
        </div>
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
