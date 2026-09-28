'use client'

import { useEffect, useId, useRef, useState, KeyboardEvent } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ChevronDown, Check } from 'lucide-react'
import { TEMPLATES, type DeckTemplate } from '@/lib/deckTemplates'
import { motionPresets } from '@/lib/motion'

interface ThemeMenuProps {
  selectedId: string
  onSelect: (id: string) => void
}

/** Pulls a human-readable font name out of a template's CSS `font-family`
 * value (e.g. `"var(--font-bricolage-grotesque), sans-serif"` → "bricolage
 * grotesque") — avoids needing a separate display-name field just for this
 * label, at the cost of assuming the variable name is the font name. */
function fontLabel(fontFamily: string): string {
  const match = fontFamily.match(/--font-([a-z0-9-]+)/)
  return match ? match[1].replace(/-/g, ' ') : fontFamily
}

/**
 * A composer-toolbar dropdown for picking a deck template — styled like a
 * design-system gallery (colored card per theme: name in its own type, a
 * swatch strip, a small content+CTA mock) rather than a plain list, so the
 * choice is legible before generating instead of a guess from a color chip.
 */
export function ThemeMenu({ selectedId, onSelect }: ThemeMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const m = motionPresets(useReducedMotion())
  const selected = TEMPLATES.find(t => t.id === selectedId) ?? TEMPLATES[0]

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    panelRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const close = (restoreFocus: boolean) => {
    setOpen(false)
    if (restoreFocus) buttonRef.current?.focus()
  }

  const onMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(panelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
    const idx = items.indexOf(document.activeElement as HTMLElement)
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      close(true)
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      items[(idx + 1) % items.length]?.focus()
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      items[(idx - 1 + items.length) % items.length]?.focus()
    } else if (e.key === 'Tab') {
      close(false)
    }
  }

  const previewBg = selected.surfaces.cover.kind === 'deck-color' ? selected.colors.accent : selected.surfaces.cover.background

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        className="dk-select dk-focus-ring"
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 'var(--r-pill)',
          border: '1px solid var(--border)',
          background: open ? 'var(--accent-soft)' : 'var(--surface-muted)',
          fontSize: 12, fontWeight: 500, color: open ? 'var(--accent)' : 'var(--text)',
          cursor: 'pointer', fontFamily: 'var(--font-body)',
        }}
      >
        <span
          aria-hidden
          style={{ width: 11, height: 11, borderRadius: 3, flexShrink: 0, background: previewBg, border: '1px solid rgba(0,0,0,0.15)' }}
        />
        Theme: {selected.name}
        <ChevronDown size={12} style={{ color: open ? 'var(--accent)' : 'var(--text-muted)' }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            id={menuId}
            role="menu"
            aria-label="Deck theme"
            onKeyDown={onMenuKeyDown}
            initial={{ opacity: 0, y: m.reduce ? 0 : -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: m.exit }}
            transition={m.menu}
            style={{
              position: 'absolute',
              // Opens downward, not upward like the Attach menu — this sits
              // on the landing page's hero composer, roughly mid-viewport,
              // so there's rarely enough room above it for a panel this
              // tall; below has the "Try these" gallery, which can scroll
              // under it without clipping against the viewport edge.
              top: '100%',
              left: 0,
              marginTop: 8,
              width: 'min(640px, 90vw)',
              maxHeight: 'min(460px, calc(100vh - 96px))',
              overflowY: 'auto',
              // A dark/near-opaque glass instead of the Attach menu's
              // translucent-white --surface — this panel is much bigger and
              // sits over busy page content (the "Try these" gallery), so it
              // needs the same solid backing as the sidebar/topbar chrome to
              // stay legible. Falls back to --surface where --surface-panel
              // isn't defined (VL1, already solid white, so no regression).
              background: 'var(--surface-panel, var(--surface))',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-lg)',
              boxShadow: 'var(--sh-3)',
              padding: 14,
              zIndex: 30,
              transformOrigin: 'top left',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {TEMPLATES.map(t => (
                <ThemeCard
                  key={t.id}
                  template={t}
                  selected={t.id === selectedId}
                  onSelect={() => { onSelect(t.id); close(true) }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ThemeCard({ template, selected, onSelect }: { template: DeckTemplate; selected: boolean; onSelect: () => void }) {
  const cover = template.surfaces.cover
  const coverBg = cover.kind === 'deck-color' ? template.colors.accent : cover.background
  // 8 cells so the strip reads as a real palette, not just the 4 chart hues.
  const strip = [
    template.colors.bg, template.colors.surfaceMuted, template.colors.border, template.colors.accentSoft,
    ...template.colors.chart,
  ].slice(0, 8)

  return (
    <button
      type="button"
      role="menuitem"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={template.name}
      title={template.blurb}
      className="dk-focus-ring"
      style={{
        textAlign: 'left',
        borderRadius: 14,
        padding: 12,
        border: '1.5px solid',
        borderColor: selected ? template.colors.accent : 'var(--border)',
        background: template.colors.bg,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        boxShadow: selected ? `0 0 0 3px ${template.colors.accentSoft}` : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <span
          style={{
            fontSize: 9.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
            color: template.colors.accent, fontFamily: template.type.body,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
        >
          {template.category} · {fontLabel(template.type.heading)}
        </span>
        {selected && (
          <span
            aria-hidden
            style={{
              width: 15, height: 15, borderRadius: '50%', flexShrink: 0,
              background: template.colors.accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Check size={9} color={template.colors.accentFg} strokeWidth={3} />
          </span>
        )}
      </div>

      <span
        style={{
          fontFamily: template.type.heading,
          fontWeight: template.type.headingWeight,
          textTransform: template.type.headingCase,
          letterSpacing: template.type.headingTracking,
          fontSize: 19,
          color: template.colors.text,
          lineHeight: 1.1,
        }}
      >
        {template.name}
      </span>

      <div style={{ height: 1, background: template.colors.border }} />

      <div style={{ display: 'flex', gap: 2.5 }} aria-hidden>
        {strip.map((c, i) => (
          <span key={i} style={{ flex: 1, height: 12, borderRadius: 3, background: c, border: '1px solid rgba(0,0,0,0.06)' }} />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6 }} aria-hidden>
        <div
          style={{
            flex: 1, borderRadius: 8, padding: '7px 8px',
            background: template.colors.surfaceMuted,
            display: 'flex', flexDirection: 'column', gap: 5, justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: 9.5, color: template.colors.textMuted, fontFamily: template.type.body, lineHeight: 1.35 }}>
            The quick brown fox jumps over the lazy dog.
          </span>
          <span
            style={{
              alignSelf: 'flex-start', fontSize: 9, fontWeight: 600, padding: '2.5px 7px', borderRadius: 999,
              background: template.colors.accent, color: template.colors.accentFg, fontFamily: template.type.body,
            }}
          >
            Continue →
          </span>
        </div>
        <div
          style={{
            width: 38, borderRadius: 8,
            background: coverBg,
            backgroundImage: cover.kind === 'pattern' ? cover.pattern : undefined,
            backgroundSize: cover.kind === 'pattern' ? (cover.patternSize ?? 'auto') : undefined,
          }}
        />
      </div>
    </button>
  )
}
