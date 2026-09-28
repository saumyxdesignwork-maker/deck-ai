import type { DeckTemplate } from '../types'

/** A third corporate direction — a bold, high-contrast keynote style.
 * Modeled on the "Making Presentations That Stick" reference: a burnt-orange
 * full-bleed cover with huge bold sans type and thin bracketing rules, white
 * content pages, near-black used for section breaks. */
export const slate: DeckTemplate = {
  id: 'slate',
  category: 'corporate',
  name: 'Slate',
  blurb: 'Burnt orange and near-black, huge bold sans, high-contrast keynote.',
  colors: {
    bg: '#FFFFFF',
    surfaceMuted: '#F2F2F2',
    text: '#161616',
    textMuted: '#5B5B5B',
    accent: '#E1592A',
    accentSoft: '#FDE4D8',
    accentFg: '#FFFFFF',
    border: '#E7E4DF',
    inverseBg: '#161616',
    inverseText: '#FFFFFF',
    chart: ['#E1592A', '#161616', '#5B5B5B', '#F2F2F2'],
  },
  type: {
    heading: 'var(--font-geist), sans-serif',
    body: 'var(--font-geist), sans-serif',
    headingWeight: 800,
    headingCase: 'none',
    headingTracking: '-0.01em',
    scale: { h1: 34, h2: 24, body: 16 },
  },
  space: { slidePad: '40px 46px', gap: 14 },
  surfaces: {
    slideRadius: 0,
    cover: { kind: 'solid', background: '#E1592A', fg: '#FFFFFF' },
    card: { bg: '#F2F2F2', border: 'none', radius: 0, shadow: 'none' },
  },
  data: { style: 'big-number', valueColor: '#E1592A' },
  image: { radius: 0, frame: 'none', filter: 'contrast(1.05)' },
  layouts: {
    // Near-black section-break slides, the orange cover's bookend on close.
    divider: { surface: 'inverse', align: 'left', headingScale: 1.2 },
    closing: { surface: 'accent', align: 'center' },
  },
}
