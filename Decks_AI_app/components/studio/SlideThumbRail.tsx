'use client'

import { motion, useReducedMotion } from 'motion/react'
import { AspectRatio, DeckData, DeckSection, Block, aspectRatioCss } from '@/lib/fixtures'
import { motionPresets } from '@/lib/motion'

interface SlideThumbRailProps {
  deck: DeckData | null
  revealedSlides: number[]
  activeIndex: number | null
  onSelect: (index: number) => void
}

// Thumbnails are drawn at a fixed "design" width, then scaled down via CSS
// transform to fit the thumbnail box exactly — the standard way editors
// (Slides, PowerPoint, Keynote) render a true miniature of the slide
// instead of a flat color swatch. Height follows the deck's own chosen
// aspect ratio so the thumbnail's shape always matches the real slide's.
const DESIGN_WIDTH = 400
const THUMB_WIDTH = 80
const SCALE = THUMB_WIDTH / DESIGN_WIDTH

function designHeight(ratio: AspectRatio | undefined): number {
  return ratio === '4:3' ? DESIGN_WIDTH * (3 / 4) : DESIGN_WIDTH * (9 / 16)
}

function MiniCover({ deck, height }: { deck: DeckData; height: number }) {
  return (
    <div
      style={{
        width: DESIGN_WIDTH,
        height,
        boxSizing: 'border-box',
        background: deck.coverColor,
        borderRadius: 16,
        padding: '40px 36px',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      <div
        style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%, rgba(0,0,0,0.2) 100%)',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1, overflow: 'hidden' }}>
        <div
          style={{
            fontFamily: 'var(--font-heading)', fontSize: 30, fontWeight: 700,
            color: 'white', lineHeight: 1.2, marginBottom: 10,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}
        >
          {deck.title}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(255,255,255,0.75)',
            marginBottom: 20, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}
        >
          {deck.subtitle}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
          <div style={{ width: 70, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.45)' }} />
        </div>
      </div>
    </div>
  )
}

function miniBlock(block: Block, key: string) {
  switch (block.type) {
    case 'heading':
      return (
        <div
          key={key}
          style={{
            fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700,
            color: 'var(--text)', lineHeight: 1.25, marginBottom: 10,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}
        >
          {block.content}
        </div>
      )
    case 'paragraph':
      return (
        <div
          key={key}
          style={{
            fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5,
            marginBottom: 10,
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}
        >
          {block.content}
        </div>
      )
    case 'callout':
      return (
        <div
          key={key}
          style={{
            borderLeft: '3px solid var(--accent)', paddingLeft: 10,
            marginBottom: 10, background: 'var(--accent-soft)', borderRadius: '0 4px 4px 0',
            fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--accent)', fontWeight: 500,
            lineHeight: 1.4, padding: '6px 10px',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}
        >
          {block.content}
        </div>
      )
    case 'image':
      return block.imageUrl ? (
        <img
          key={key}
          src={block.imageUrl}
          alt=""
          draggable={false}
          style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 10, marginBottom: 10, display: 'block' }}
        />
      ) : (
        <div key={key} style={{ height: 90, borderRadius: 10, background: 'var(--surface-muted)', border: '1px dashed var(--border)', marginBottom: 10 }} />
      )
    case 'card-group':
      if (!block.cards?.length) return null
      return (
        <div key={key} style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(block.cards.length, 3)}, 1fr)`, gap: 6, marginBottom: 10 }}>
          {block.cards.slice(0, 3).map((card, i) => (
            <div key={i} style={{ padding: '8px 8px', borderRadius: 8, background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12 }}>{card.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', marginTop: 2 }}>{card.value}</div>
            </div>
          ))}
        </div>
      )
    default:
      return null
  }
}

function MiniSection({ section, height }: { section: DeckSection; height: number }) {
  return (
    <div
      style={{
        width: DESIGN_WIDTH,
        height,
        boxSizing: 'border-box',
        // --surface-solid — same reasoning as ContentSection: a slide's
        // content shouldn't render as translucent glass just because VL2/VL3
        // use glass for floating chrome elsewhere.
        background: 'var(--surface-solid)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '26px 30px',
        overflow: 'hidden',
      }}
    >
      {section.blocks.slice(0, 3).map((block, i) => miniBlock(block, `${section.id}-${i}`))}
    </div>
  )
}

export function SlideThumbRail({ deck, revealedSlides, activeIndex, onSelect }: SlideThumbRailProps) {
  const fadeIn = motionPresets(useReducedMotion()).content
  const totalSlides = deck ? 1 + deck.sections.length : 0
  const slots = Array.from({ length: totalSlides }, (_, i) => i)
  const height = designHeight(deck?.aspectRatio)

  function slideTitle(index: number) {
    if (!deck) return ''
    if (index === 0) return 'Cover'
    return deck.sections[index - 1]?.title ?? ''
  }

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
            aria-label={revealed ? `Slide ${i + 1}: ${slideTitle(i)}` : `Slide ${i + 1}, not written yet`}
            aria-current={isActive || undefined}
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: aspectRatioCss(deck?.aspectRatio),
              borderRadius: 'var(--r-sm)',
              border: '1.5px solid',
              borderColor: isActive ? 'var(--accent)' : 'var(--border)',
              background: revealed ? 'var(--surface-solid)' : 'var(--surface-muted)',
              cursor: revealed ? 'pointer' : 'default',
              padding: 0,
              overflow: 'hidden',
              transition: 'border-color 0.12s',
            }}
          >
            {revealed && deck && (
              // Fades in once, when this slide is first written.
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={fadeIn}
                style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit' }}
              >
                <div style={{ width: DESIGN_WIDTH, height, transform: `scale(${SCALE})`, transformOrigin: 'top left', pointerEvents: 'none' }}>
                  {i === 0 ? <MiniCover deck={deck} height={height} /> : <MiniSection section={deck.sections[i - 1]} height={height} />}
                </div>
              </motion.div>
            )}
            <span
              style={{
                position: 'absolute',
                top: 3, left: 4,
                padding: revealed ? '0 3px' : 0,
                borderRadius: 3,
                background: revealed ? 'rgba(0,0,0,0.5)' : 'transparent',
                fontSize: 9, fontWeight: 700,
                color: revealed ? 'rgba(255,255,255,0.9)' : 'var(--text-disabled)',
              }}
            >
              {i + 1}
            </span>
            {!revealed && (
              // Static placeholder — the canvas's "Agent is working" label
              // is the single progress indicator; no pulsing thumbnails.
              <div style={{ position: 'absolute', inset: 4, background: 'var(--border)', borderRadius: 3, opacity: 0.4 }} />
            )}
          </button>
        )
      })}
    </div>
  )
}
