'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { X, Check } from 'lucide-react'
import { TEMPLATES, getTemplate, type DeckTemplate, type TemplateCategory } from '@/lib/deckTemplates'
import { DeckTemplateProvider, DeckThemeScope } from '@/components/deck/DeckThemeScope'
import { resolveCoverVars } from '@/lib/deckTemplates/toCssVars'
import { renderBlockPreview } from '@/components/editor/PresentationMode'
import { MOCK_DECK } from '@/lib/fixtures'
import { motionPresets } from '@/lib/motion'

// Short, descriptive copy per template — not product claims, just what each
// design system reads as. Easy to extend if a 7th template is added.
const BEST_FOR: Record<string, string[]> = {
  meridian: ['Investor updates and board decks', 'Launches that need to read as serious', 'A deck going to a mixed internal audience'],
  ledger: ['Finance and board reviews', 'Anything that should feel boardroom-serious', 'Quarterly or annual reports'],
  slate: ['Keynotes and all-hands presentations', 'High-contrast decks read from the back of a room', 'Culture or vision decks'],
  riso: ['Pitch decks that want to look printed, not corporate', 'Creative studio or agency portfolios', 'Anything that should feel handmade'],
  noir: ['Tech talks and product deep-dives', 'A sharp, modern engineering audience', 'Dark-mode-native presentations'],
  bloom: ['Onboarding and culture decks', 'Anything that should feel warm and approachable', 'Workshops and team offsites'],
}

const CATEGORY_FILTERS: { key: TemplateCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'corporate', label: 'Corporate' },
  { key: 'creative', label: 'Creative' },
]

interface TemplatePreviewModalProps {
  initialTemplateId: string
  /** 'single': opened from one specific "Try these" card — just a rail to
   * browse from. 'browse': opened from "Browse templates…" — adds category
   * filter chips above the rail. Same component either way; see the plan
   * this was built from for why a second component wasn't worth it. */
  mode: 'single' | 'browse'
  onAdd: (templateId: string) => void
  onClose: () => void
}

export function TemplatePreviewModal({ initialTemplateId, mode, onAdd, onClose }: TemplatePreviewModalProps) {
  const [activeId, setActiveId] = useState(() => (getTemplate(initialTemplateId).id))
  const [category, setCategory] = useState<TemplateCategory | 'all'>('all')
  const containerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)
  const m = motionPresets(useReducedMotion())

  const template = getTemplate(activeId)
  const visibleTemplates = useMemo(
    () => (category === 'all' ? TEMPLATES : TEMPLATES.filter(t => t.category === category)),
    [category],
  )

  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null
    titleRef.current?.focus()
    return () => previouslyFocusedRef.current?.focus?.()
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.isComposing) {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === 'Tab') {
        const items = focusables(panelRef.current)
        if (!items.length) return
        const first = items[0]
        const last = items[items.length - 1]
        const active = document.activeElement
        const inside = !!active && !!panelRef.current?.contains(active)
        if (e.shiftKey && (active === first || !inside)) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && (active === last || !inside)) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const previewSection = MOCK_DECK.sections[0]

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-preview-title"
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: m.exit }}
      transition={m.overlay}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, scale: m.reduce ? 1 : 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: m.reduce ? 1 : 0.98, transition: m.exit }}
        transition={m.overlay}
        style={{
          width: 'min(1040px, calc(100vw - 48px))',
          height: 'min(680px, calc(100vh - 48px))',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          background: 'var(--surface-solid)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-xl)', boxShadow: 'var(--sh-3)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px', borderBottom: '1px solid var(--divider)', flexShrink: 0 }}>
          <div
            id="template-preview-title"
            ref={titleRef}
            tabIndex={-1}
            style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-body)', outline: 'none' }}
          >
            {mode === 'browse' ? 'Browse templates' : 'Preview template'}
          </div>
          <button onClick={onClose} aria-label="Close" style={iconBtnStyle}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Center — slide preview */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--surface-muted)' }}>
            <div style={{ flex: 1, overflow: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
              <DeckTemplateProvider templateId={activeId}>
                <CoverPreview template={template} />
                <ContentPreview template={template} section={previewSection} />
              </DeckTemplateProvider>
            </div>

            {/* Bottom rail — all 6 (or filtered) templates, switch the preview */}
            <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px', flexShrink: 0 }}>
              {mode === 'browse' && (
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  {CATEGORY_FILTERS.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setCategory(key)}
                      aria-pressed={category === key}
                      style={{
                        padding: '5px 12px', borderRadius: 'var(--r-pill)',
                        border: '1px solid', borderColor: category === key ? 'var(--accent)' : 'var(--border)',
                        background: category === key ? 'var(--accent-soft)' : 'var(--surface)',
                        color: category === key ? 'var(--accent)' : 'var(--text-muted)',
                        fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
                {visibleTemplates.map(t => (
                  <RailThumb key={t.id} template={t} selected={t.id === activeId} onSelect={() => setActiveId(t.id)} />
                ))}
              </div>
            </div>
          </div>

          {/* Right — info panel */}
          <div style={{ width: 280, flexShrink: 0, borderLeft: '1px solid var(--divider)', padding: 20, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 6, fontFamily: 'var(--font-body)' }}>
              {template.category}
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px', fontFamily: 'var(--font-heading)' }}>
              {template.name}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55, margin: '0 0 16px', fontFamily: 'var(--font-body)' }}>
              {template.blurb}
            </p>

            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-disabled)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'var(--font-body)' }}>
              Best for
            </div>
            <ul style={{ margin: '0 0 18px', padding: '0 0 0 18px', fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.7, fontFamily: 'var(--font-body)' }}>
              {(BEST_FOR[template.id] ?? []).map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>

            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-disabled)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'var(--font-body)' }}>
              Styling
            </div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 20 }} aria-hidden>
              {[template.colors.bg, template.colors.accent, template.colors.accentSoft, ...template.colors.chart].slice(0, 6).map((c, i) => (
                <span key={i} style={{ flex: 1, height: 20, borderRadius: 5, background: c, border: '1px solid rgba(0,0,0,0.08)' }} />
              ))}
            </div>

            <div style={{ flex: 1 }} />

            <button
              type="button"
              onClick={() => onAdd(activeId)}
              className="dk-press dk-focus-ring"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: '11px 16px', borderRadius: 'var(--r-pill)',
                border: 'none', background: 'var(--primary)', color: 'var(--primary-fg)',
                fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}
            >
              {mode === 'browse' ? 'Use this template' : 'Add this template'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function RailThumb({ template, selected, onSelect }: { template: DeckTemplate; selected: boolean; onSelect: () => void }) {
  const cover = template.surfaces.cover
  const coverBg = cover.kind === 'deck-color' ? template.colors.accent : cover.background
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={template.name}
      title={template.name}
      className="dk-focus-ring"
      style={{
        width: 86, flexShrink: 0, borderRadius: 10, overflow: 'hidden',
        // The app's own accent, not the template's — a per-template accent
        // (e.g. Ledger's muted gold) can read as part of the artwork rather
        // than a selection state, especially next to a louder unselected
        // neighbor. Every other selection control in this app (mode pills,
        // ratio pills, tabs) uses the same single consistent accent.
        border: '2px solid', borderColor: selected ? 'var(--accent)' : 'var(--border)',
        cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column',
        boxShadow: selected ? '0 0 0 2px var(--accent-soft)' : 'none',
      }}
    >
      <div
        style={{
          aspectRatio: '16 / 9',
          // backgroundColor + backgroundImage (not the `background` shorthand)
          // so a pattern cover's image/size can layer over the color without
          // the two fighting on rerender — same reasoning as DeckThemeScope.
          backgroundColor: coverBg,
          backgroundImage: cover.kind === 'pattern' ? cover.pattern : undefined,
          backgroundSize: cover.kind === 'pattern' ? (cover.patternSize ?? 'auto') : undefined,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start', position: 'relative',
        }}
      >
        {selected && (
          <span
            aria-hidden
            style={{
              position: 'absolute', top: 4, right: 4, width: 14, height: 14, borderRadius: '50%',
              background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
            }}
          >
            <Check size={9} color="white" strokeWidth={3} />
          </span>
        )}
      </div>
      <span style={{ fontSize: 10.5, padding: '4px 6px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {template.name}
      </span>
    </button>
  )
}

function CoverPreview({ template }: { template: DeckTemplate }) {
  const cover = template.surfaces.cover
  const coverBg = cover.kind === 'deck-color' ? template.colors.accent : cover.background
  return (
    <div
      style={{
        ...resolveCoverVars(template),
        backgroundColor: coverBg,
        backgroundImage: cover.kind === 'pattern' ? cover.pattern : undefined,
        backgroundSize: cover.kind === 'pattern' ? (cover.patternSize ?? 'auto') : undefined,
        borderRadius: template.surfaces.slideRadius,
        padding: template.space.slidePad,
        width: '100%', maxWidth: 640, aspectRatio: '16 / 9', flexShrink: 0,
        boxSizing: 'border-box', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        boxShadow: 'var(--sh-2)',
      }}
    >
      <h1
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 'var(--dt-h-weight, 700)' as unknown as number,
          textTransform: 'var(--dt-h-case, none)' as React.CSSProperties['textTransform'],
          letterSpacing: 'var(--dt-h-track, normal)',
          fontSize: 26, color: 'var(--dt-cover-fg)', lineHeight: 1.2, margin: 0,
        }}
      >
        {MOCK_DECK.title}
      </h1>
    </div>
  )
}

function ContentPreview({ template, section }: { template: DeckTemplate; section: typeof MOCK_DECK.sections[number] }) {
  return (
    <DeckThemeScope
      layout={section.layout}
      style={{
        width: '100%', maxWidth: 640, aspectRatio: '16 / 9', flexShrink: 0,
        borderRadius: template.surfaces.slideRadius, overflow: 'hidden', boxShadow: 'var(--sh-2)',
      }}
    >
      {section.blocks.map(block => renderBlockPreview(block, section.layout, template))}
    </DeckThemeScope>
  )
}

function focusables(root: HTMLElement | null): HTMLElement[] {
  if (!root) return []
  return Array.from(
    root.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])'),
  )
}

const iconBtnStyle: React.CSSProperties = {
  width: 26, height: 26, borderRadius: '50%', border: 'none', background: 'transparent',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0,
}
