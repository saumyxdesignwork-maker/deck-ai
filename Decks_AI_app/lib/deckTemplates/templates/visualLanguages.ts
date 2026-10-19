import catalogue from '@/lib/template-engine/catalogue.json'
import type { DeckTemplate } from '../types'

/** Prefix for template ids rendered by the template engine (lib/template-engine) instead of the block renderer. */
export const VL_PREFIX = 'vl-'

interface CatalogueEntry {
  id: string
  name: string
  category: 'corporate' | 'creative'
  blurb: string
  bestFor: string[]
  palette: Record<string, string | string[]>
  fonts: { display: string; text: string; label: string }
  defaultGround: string
}

const str = (v: string | string[] | undefined, fallback: string) => (typeof v === 'string' ? v : Array.isArray(v) ? v[0] ?? fallback : fallback)
const family = (name: string) => `"${name}", ui-sans-serif, system-ui, sans-serif`

/**
 * The template-engine visual languages, described in the app's DeckTemplate shape so every picker, theme menu
 * and fallback keeps working unchanged. Colours/fonts here only drive picker cards and app chrome; the slides
 * themselves are drawn by the engine (see components/deck/EngineDeck.tsx), keyed off `engine.vl`.
 */
export const VISUAL_LANGUAGE_TEMPLATES: DeckTemplate[] = (catalogue as unknown as CatalogueEntry[]).map(v => {
  const p = v.palette
  const dark = v.defaultGround === 'inverse'
  const bg = str(dark ? p['ground.inverse'] : p['ground.base'], '#FFFFFF')
  const text = str(dark ? p['ink.on-inverse'] : p['ink.primary'], dark ? '#FFFFFF' : '#111111')
  const accent = str(p['emphasis'], text)
  const muted = str(dark ? p['ink.muted-on-inverse'] ?? p['ink.on-inverse'] : p['ink.muted'], text)
  const chart = Array.isArray(p['chart.series']) ? (p['chart.series'] as string[]) : [accent]
  const accentGround = Array.isArray(p['ground.accent']) ? (p['ground.accent'] as string[])[0] : undefined
  return {
    id: `${VL_PREFIX}${v.id}`,
    category: v.category,
    name: v.name,
    blurb: v.blurb,
    engine: { vl: v.id, bestFor: v.bestFor },
    colors: {
      bg,
      surfaceMuted: str(dark ? p['ground.inverse'] : p['ground.base'], bg),
      text,
      textMuted: muted,
      accent,
      accentSoft: accentGround ?? str(p['surface.card'], bg),
      accentFg: dark ? str(p['ground.inverse'], '#000000') : str(p['ground.base'], '#FFFFFF'),
      border: str(dark ? p['line'] : p['line.on-base'] ?? p['line'], '#00000022'),
      inverseBg: str(dark ? p['ground.base'] : p['ground.inverse'], '#000000'),
      inverseText: str(dark ? p['ink.primary'] : p['ink.on-inverse'], '#FFFFFF'),
      chart,
    },
    type: {
      heading: family(v.fonts.display),
      body: family(v.fonts.text),
      headingWeight: 600,
      headingCase: 'none',
      headingTracking: '-0.02em',
      scale: { h1: 34, h2: 24, body: 15 },
    },
    space: { slidePad: '40px 46px', gap: 14 },
    surfaces: {
      slideRadius: 0,
      cover: { kind: 'solid', background: bg, fg: text },
      card: { bg: str(p['surface.card'], bg), border: `1px solid ${str(p['line'], '#00000022')}`, radius: 0, shadow: 'none' },
    },
    data: { style: 'big-number', valueColor: accent },
    image: { radius: 0, frame: 'none', filter: 'none' },
  }
})

export function isEngineTemplateId(id: string | undefined): boolean {
  return !!id && id.startsWith(VL_PREFIX)
}
