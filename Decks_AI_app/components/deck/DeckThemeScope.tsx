'use client'

import { createContext, useContext, ReactNode } from 'react'
import { DeckTemplate, getTemplate, DEFAULT_TEMPLATE_ID } from '@/lib/deckTemplates'
import { resolveSlideVars } from '@/lib/deckTemplates/toCssVars'
import type { LayoutType } from '@/lib/fixtures'

// Default is the default template itself (not null/undefined) — every
// consumer works even without a <DeckTemplateProvider> ancestor (tests, the
// Classic editor before it's wired, Storybook-style isolated renders).
const DeckTemplateContext = createContext<DeckTemplate>(getTemplate(DEFAULT_TEMPLATE_ID))

export function DeckTemplateProvider({ templateId, children }: { templateId: string | undefined; children: ReactNode }) {
  return <DeckTemplateContext.Provider value={getTemplate(templateId)}>{children}</DeckTemplateContext.Provider>
}

export function useDeckTemplate(): DeckTemplate {
  return useContext(DeckTemplateContext)
}

interface DeckThemeScopeProps {
  /** The section's layout, if this scope wraps a content slide — lets a
   * template swap to an 'accent'/'inverse' surface for specific layouts
   * (e.g. a divider or closing slide). Omit for the cover. */
  layout?: LayoutType
  className?: string
  style?: React.CSSProperties
  children: ReactNode
}

/**
 * Wraps slide CONTENT (never editor chrome — see ContentSection's frame/
 * scope split) in scoped CSS custom properties so every block underneath,
 * which already reads `var(--surface-solid)`, `var(--text)`, `var(--accent)`,
 * `var(--font-heading)` etc, picks up the deck's template instead of the
 * app's own Craft/Night/Warm theme. `borderRadius: 'inherit'` matters here:
 * the parent frame owns the actual border-radius, but frames use
 * `overflow: auto` (for scrolling), not `hidden`, so they don't clip a
 * child's background at the rounded corners — this makes the scope's own
 * background self-round to match instead.
 */
export function DeckThemeScope({ layout, className, style, children }: DeckThemeScopeProps) {
  const template = useDeckTemplate()
  return (
    <div
      data-deck-template={template.id}
      className={className}
      style={{
        ...resolveSlideVars(template, layout),
        borderRadius: 'inherit',
        minHeight: '100%',
        boxSizing: 'border-box',
        // backgroundColor + backgroundImage (not the `background` shorthand)
        // so a template's grain/dot texture (--dt-texture) can layer over
        // the solid surface color instead of one clobbering the other.
        backgroundColor: 'var(--surface-solid)',
        backgroundImage: 'var(--dt-texture, none)',
        backgroundSize: 'var(--dt-texture-size, auto)',
        color: 'var(--text)',
        padding: 'var(--dt-pad)',
        position: 'relative',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** Four small print-registration crop-mark brackets pinned to a slide's
 * corners — a decorative nod to the editorial/print references (Geist*Studio,
 * Complex Collective) that run this as a masthead device on every slide.
 * Purely visual, `aria-hidden`, and drawn in the template's own border/text
 * color so it reads as ink rather than UI chrome. Positioned absolutely
 * against whichever ancestor is `position: relative` (the frame in
 * ContentSection, or CoverBlock's own root). */
export function CornerMarks({ color }: { color: string }) {
  const size = 14
  const thickness = 1.5
  const inset = 10
  const armStyle: React.CSSProperties = { position: 'absolute', background: color }
  const corners: Array<{ top?: number; bottom?: number; left?: number; right?: number }> = [
    { top: inset, left: inset },
    { top: inset, right: inset },
    { bottom: inset, left: inset },
    { bottom: inset, right: inset },
  ]
  return (
    <>
      {corners.map((pos, i) => (
        <div key={i} aria-hidden style={{ position: 'absolute', width: size, height: size, ...pos, pointerEvents: 'none', zIndex: 2 }}>
          <div style={{ ...armStyle, width: size, height: thickness, top: pos.top !== undefined ? 0 : 'auto', bottom: pos.bottom !== undefined ? 0 : 'auto' }} />
          <div style={{ ...armStyle, height: size, width: thickness, left: pos.left !== undefined ? 0 : 'auto', right: pos.right !== undefined ? 0 : 'auto' }} />
        </div>
      ))}
    </>
  )
}
