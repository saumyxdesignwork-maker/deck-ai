'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { DeckData } from '@/lib/fixtures'
import { toEngineDeckWithSources, type SlotSource, type SlotSources } from '@/lib/template-engine-adapter'
import { richFromDom } from '@/lib/template-engine/compiler'

type EngineModule = typeof import('@/lib/template-engine')
type RenderedDeck = ReturnType<EngineModule['renderDeck']>

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

// One render per deck object + visual language, shared by every EngineDeck
// drawing it — the thumbnail rail mounts one per slide.
const renderCache = new WeakMap<DeckData, Map<string, { rendered: RenderedDeck; sources: SlotSources }>>()
function renderCached(engine: EngineModule, deck: DeckData, vl: string) {
  let byVl = renderCache.get(deck)
  if (!byVl) renderCache.set(deck, (byVl = new Map()))
  let hit = byVl.get(vl)
  if (!hit) {
    const { deck: engineDeck, sources } = toEngineDeckWithSources(deck, vl)
    byVl.set(vl, (hit = { rendered: engine.renderDeck(engineDeck), sources }))
  }
  return hit
}

const EDITABLE = '[data-slot-type="text"][data-slot], [data-slot-type="rich"][data-slot]'

const editCss = `
.dk-engine-editable [data-engine-edit] { cursor: text; border-radius: 4px; }
.dk-engine-editable [data-engine-edit]:hover { outline: 3px dashed color-mix(in srgb, currentColor 35%, transparent); outline-offset: 8px; }
.dk-engine-editable [data-engine-edit]:focus { outline: 4px solid var(--accent); outline-offset: 8px; }
`

interface EngineDeckProps {
  deck: DeckData
  /** Template-engine visual language id (DeckTemplate.engine.vl). */
  vl: string
  /** Render only these slide indexes (0 = cover). Omit to render every slide;
   * `[]` renders just the deck's stylesheet (see `styles`). */
  only?: number[]
  /** Emit the deck's stylesheet. Turn off when another EngineDeck for the
   * same deck + vl already does (e.g. one per thumbnail). Default true. */
  styles?: boolean
  /** Receives each slide's outer element — the node deck export captures. */
  slideRef?: (index: number, el: HTMLDivElement | null) => void
  activeIndex?: number | null
  onSelect?: (index: number) => void
  /** Gap between stacked slides, px. */
  gap?: number
  /** Show the active-slide outline (Studio canvas). */
  showFrame?: boolean
  /** Inline text editing — the same contract as ContentSection's blocks:
   * focus begins one undoable pass, each keystroke writes the block's
   * content, blur commits. Text slots with a source block become editable. */
  onUpdateBlockContent?: (blockId: string, text: string) => void
  onBeginBlockEdit?: () => void
  onCommitBlockEdit?: () => void
}

/**
 * Draws a deck with the template engine: each slide is engine HTML at its native
 * frame size (1920×1080), scaled down to the container's width. Slide text is
 * escaped by the engine's compiler, so the HTML is safe to inject.
 */
export function EngineDeck({
  deck, vl, only, styles = true, slideRef, activeIndex, onSelect, gap = 18, showFrame = false,
  onUpdateBlockContent, onBeginBlockEdit, onCommitBlockEdit,
}: EngineDeckProps) {
  const engine = useEngine()
  const rootRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const editable = !!onUpdateBlockContent

  const result = useMemo(() => (engine ? renderCached(engine, deck, vl) : null), [engine, deck, vl])
  const rendered = result?.rendered ?? null

  // While a slot is being typed into, its slide keeps the HTML it had when
  // editing began: re-injecting fresh engine HTML on every keystroke would
  // replace the node under the caret. The slide redraws once editing leaves it.
  const [frozen, setFrozen] = useState<{ index: number; html: string } | null>(null)
  const unfreezeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const editing = useRef<{ el: HTMLElement; source: SlotSource } | null>(null)

  useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    ro.observe(el)
    setWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  useEffect(() => () => clearTimeout(unfreezeTimer.current), [])

  // Fit pass (shrink-to-fit type, frame-bounds checks) once fonts are in.
  useEffect(() => {
    if (!engine || !rendered) return
    let live = true
    document.fonts.ready.then(() => {
      if (!live || !rootRef.current) return
      for (const s of rootRef.current.querySelectorAll<HTMLElement>('section.slide')) engine.fitSlide(s)
    })
    return () => { live = false }
  }, [engine, rendered, width, frozen])

  // Mark the text slots that map back to a block as editable. Runs after
  // every render: injected HTML loses these attributes whenever it changes.
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || !result || !editable) return
    for (const slideEl of root.querySelectorAll<HTMLElement>('[data-engine-slide]')) {
      const sources = result.sources[Number(slideEl.dataset.engineSlide)] ?? {}
      for (const el of slideEl.querySelectorAll<HTMLElement>(EDITABLE)) {
        if (!sources[el.dataset.slot!] || el.hasAttribute('data-engine-edit')) continue
        el.setAttribute('data-engine-edit', '')
        el.contentEditable = 'plaintext-only'
        el.spellcheck = false
      }
    }
  })

  const slotOf = (target: EventTarget) => (target as HTMLElement).closest?.<HTMLElement>('[data-engine-edit]') ?? null
  const slotValue = (el: HTMLElement) => (el.dataset.slotType === 'rich' ? richFromDom(el) : el.textContent ?? '').trim()

  const handleFocus = (index: number, e: React.FocusEvent) => {
    const el = slotOf(e.target)
    const source = el && result?.sources[index]?.[el.dataset.slot!]
    if (!el || !source || !rendered) return
    clearTimeout(unfreezeTimer.current)
    // Moving between slots of the same slide keeps the HTML already on screen.
    const html = rendered.slides[index]!
    setFrozen(f => (f?.index === index ? f : { index, html }))
    editing.current = { el, source }
    onBeginBlockEdit?.()
  }

  const handleInput = (e: React.FormEvent) => {
    const cur = editing.current
    if (!cur || slotOf(e.target) !== cur.el) return
    onUpdateBlockContent?.(cur.source.blockId, cur.source.before + slotValue(cur.el) + cur.source.after)
  }

  const handleBlur = (e: React.FocusEvent) => {
    if (!editing.current || slotOf(e.target) !== editing.current.el) return
    editing.current = null
    onCommitBlockEdit?.()
    unfreezeTimer.current = setTimeout(() => setFrozen(null), 0)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!editing.current) return
    // One line per slot: Enter and Escape finish the edit, like the engine's preview.
    if ((e.key === 'Enter' && !e.shiftKey) || e.key === 'Escape') {
      e.preventDefault()
      editing.current.el.blur()
    }
  }

  const indexes = rendered ? (only ?? rendered.slides.map((_, i) => i)).filter(i => i < rendered.slides.length) : []
  const frame = rendered?.frame ?? (deck.aspectRatio === '4:3' ? { w: 1440, h: 1080 } : { w: 1920, h: 1080 })
  const scale = width ? width / frame.w : 0

  return (
    <div ref={rootRef} className={editable ? 'dk-engine-editable' : undefined} style={{ width: '100%' }}>
      {rendered && styles && <style>{rendered.css}</style>}
      {rendered && styles && editable && <style>{editCss}</style>}
      {!rendered && only?.length !== 0 && <div style={{ aspectRatio: `${frame.w} / ${frame.h}`, borderRadius: 4, background: 'var(--surface-muted)' }} />}
      {rendered && indexes.map((i, n) => (
        <div
          key={rendered.plan[i]?.slide.id ?? i}
          ref={el => slideRef?.(i, el)}
          data-engine-slide={i}
          onClick={onSelect ? () => onSelect(i) : undefined}
          onFocus={editable ? e => handleFocus(i, e) : undefined}
          onInput={editable ? handleInput : undefined}
          onBlur={editable ? handleBlur : undefined}
          onKeyDown={editable ? handleKeyDown : undefined}
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
            dangerouslySetInnerHTML={{ __html: frozen?.index === i ? frozen.html : rendered.slides[i]! }}
          />
        </div>
      ))}
    </div>
  )
}
