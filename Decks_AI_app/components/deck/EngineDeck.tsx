'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { DeckData } from '@/lib/fixtures'
import { toEngineDeck } from '@/lib/template-engine-adapter'

type EngineModule = typeof import('@/lib/template-engine')

// The engine + its layouts (~400 KB) and fonts load only once a deck actually
// uses an engine template, so pages on the classic templates never pay for them.
let enginePromise: Promise<EngineModule> | null = null
function loadEngine() {
  enginePromise ??= Promise.all([import('@/lib/template-engine'), import('@/lib/template-engine/fonts')]).then(([m]) => m)
  return enginePromise
}

function useEngine(): EngineModule | null {
  const [engine, setEngine] = useState<EngineModule | null>(null)
  useEffect(() => {
    let live = true
    loadEngine().then(m => { if (live) setEngine(m) })
    return () => { live = false }
  }, [])
  return engine
}

interface EngineDeckProps {
  deck: DeckData
  /** Template-engine visual language id (DeckTemplate.engine.vl). */
  vl: string
  /** Render only these slide indexes (0 = cover). Omit to render every slide. */
  only?: number[]
  /** Receives each slide's outer element — the node deck export captures. */
  slideRef?: (index: number, el: HTMLDivElement | null) => void
  activeIndex?: number | null
  onSelect?: (index: number) => void
  /** Gap between stacked slides, px. */
  gap?: number
  /** Show the active-slide outline (Studio canvas). */
  showFrame?: boolean
}

/**
 * Draws a deck with the template engine: each slide is engine HTML at its native
 * frame size (1920×1080), scaled down to the container's width. Slide text is
 * escaped by the engine's compiler, so the HTML is safe to inject.
 */
export function EngineDeck({ deck, vl, only, slideRef, activeIndex, onSelect, gap = 18, showFrame = false }: EngineDeckProps) {
  const engine = useEngine()
  const rootRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  const rendered = useMemo(() => (engine ? engine.renderDeck(toEngineDeck(deck, vl)) : null), [engine, deck, vl])

  useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    ro.observe(el)
    setWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  // Fit pass (shrink-to-fit type, frame-bounds checks) once fonts are in.
  useEffect(() => {
    if (!engine || !rendered) return
    let live = true
    document.fonts.ready.then(() => {
      if (!live || !rootRef.current) return
      for (const s of rootRef.current.querySelectorAll<HTMLElement>('section.slide')) engine.fitSlide(s)
    })
    return () => { live = false }
  }, [engine, rendered, width])

  const indexes = rendered ? (only ?? rendered.slides.map((_, i) => i)).filter(i => i < rendered.slides.length) : []
  const frame = rendered?.frame ?? (deck.aspectRatio === '4:3' ? { w: 1440, h: 1080 } : { w: 1920, h: 1080 })
  const scale = width ? width / frame.w : 0

  return (
    <div ref={rootRef} style={{ width: '100%' }}>
      {rendered && <style>{rendered.css}</style>}
      {!rendered && <div style={{ aspectRatio: `${frame.w} / ${frame.h}`, borderRadius: 4, background: 'var(--surface-muted)' }} />}
      {rendered && indexes.map((i, n) => (
        <div
          key={rendered.plan[i]?.slide.id ?? i}
          ref={el => slideRef?.(i, el)}
          data-engine-slide={i}
          onClick={onSelect ? () => onSelect(i) : undefined}
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: `${frame.w} / ${frame.h}`,
            overflow: 'hidden',
            marginTop: n ? gap : 0,
            outline: showFrame && activeIndex === i ? '2px solid var(--accent)' : 'none',
            outlineOffset: 3,
            cursor: onSelect ? 'pointer' : undefined,
          }}
        >
          <div
            className={`deck ${rendered.scopeClass}`}
            style={{
              ['--frame-w' as string]: `${frame.w}px`,
              ['--frame-h' as string]: `${frame.h}px`,
              width: frame.w,
              height: frame.h,
              transform: `scale(${scale})`,
              transformOrigin: '0 0',
              visibility: scale ? 'visible' : 'hidden',
            }}
            dangerouslySetInnerHTML={{ __html: rendered.slides[i]! }}
          />
        </div>
      ))}
    </div>
  )
}
