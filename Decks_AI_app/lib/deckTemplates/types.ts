import type { LayoutType } from '../fixtures'

export type TemplateCategory = 'corporate' | 'creative'

/** Which base/text pairing a layout should use when it wants to stand apart
 * from the deck's normal slide color — 'accent' and 'inverse' are how a
 * template like Riso makes its section dividers or closing slide read as a
 * deliberate beat instead of just another content slide. 'base' is the
 * default every layout uses unless a template overrides it. */
export type SlideSurface = 'base' | 'accent' | 'inverse'

export interface DeckTemplateColors {
  bg: string
  surfaceMuted: string
  text: string
  textMuted: string
  accent: string
  accentSoft: string
  accentFg: string
  border: string
  /** Used only by layouts/surfaces set to 'inverse' (e.g. a closing slide
   * on a dark card inside an otherwise light template). */
  inverseBg: string
  inverseText: string
  /** For future chart/data-viz blocks — not consumed by any renderer yet. */
  chart: string[]
}

export interface DeckTemplateType {
  /** CSS font-family value, e.g. "var(--font-bricolage), sans-serif". */
  heading: string
  body: string
  numeric?: string
  headingWeight: number
  headingCase: 'none' | 'uppercase'
  headingTracking: string
  scale: { h1: number; h2: number; body: number }
}

export interface DeckTemplateCover {
  kind: 'solid' | 'gradient' | 'pattern' | 'deck-color'
  /** CSS background value for 'solid'/'gradient'; ignored for 'deck-color'
   * (uses DeckData.coverColor) and layered under 'pattern'. */
  background: string
  fg: string
  /** A CSS background-image value (e.g. a radial-gradient halftone/speckle)
   * layered over `background` when kind is 'pattern'. Needs `patternSize`
   * alongside it to actually tile — a bare radial-gradient has no repeat
   * size of its own and renders as a single dot otherwise. */
  pattern?: string
  /** `background-size` for `pattern` above, e.g. `'8px 8px'`. */
  patternSize?: string
}

export interface DeckTemplateCard {
  bg: string
  /** Full CSS `border` shorthand (e.g. `'1px solid #E2E8F0'`), not just a
   * color — width varies by template (Riso's is 2px), so the color alone
   * isn't enough. */
  border: string
  radius: number
  shadow: string
}

export interface DeckTemplateImage {
  radius: number
  frame: string
  filter: string
  blend?: string
}

export interface DeckTemplateLayoutOverride {
  surface?: SlideSurface
  align?: 'left' | 'center'
  headingScale?: number
}

export interface DeckTemplate {
  id: string
  category: TemplateCategory
  name: string
  blurb: string
  colors: DeckTemplateColors
  type: DeckTemplateType
  space: { slidePad: string; gap: number }
  surfaces: {
    slideRadius: number
    cover: DeckTemplateCover
    card: DeckTemplateCard
    /** A subtle CSS `background-image` (grain/dot/speckle) layered under a
     * slide's content — for print/editorial templates (Geist*Studio-style
     * red-and-black, Complex-style grunge) that read as flat/generic
     * without it. Omit for templates that want a clean flat surface. Needs
     * `textureSize` alongside it to actually tile (a bare radial-gradient
     * has no repeat size of its own). */
    texture?: string
    /** `background-size` for `texture` above, e.g. `'10px 10px'` for a dot grid. */
    textureSize?: string
    /** Renders four small print-registration crop-mark brackets pinned to
     * the slide's corners (cover + content), echoing the reference decks
     * that use them as a running masthead device. Purely decorative. */
    cornerMarks?: boolean
  }
  data: { style: 'plain' | 'boxed' | 'big-number'; valueColor: string }
  image: DeckTemplateImage
  layouts?: Partial<Record<LayoutType, DeckTemplateLayoutOverride>>
}
