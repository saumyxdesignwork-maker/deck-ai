import type { DeckTemplate } from '../types'

/** A warm, illustrated direction modeled on the Mailchimp report reference:
 * bright yellow and cream, a friendly serif headline, thin black hairline
 * borders (the weight of hand-drawn line art), and a speckled cover —
 * approximating the reference's ink-splatter corners as a dot texture. */
export const bloom: DeckTemplate = {
  id: 'bloom',
  category: 'creative',
  name: 'Bloom',
  blurb: 'Bright yellow and cream, friendly serif, illustrated and hand-drawn.',
  colors: {
    bg: '#F7EFDD',
    surfaceMuted: '#F0E4C8',
    text: '#1A1A1A',
    textMuted: '#6B6350',
    accent: '#FFD400',
    accentSoft: '#FFF3B0',
    accentFg: '#1A1A1A',
    border: '#1A1A1A',
    inverseBg: '#1A1A1A',
    inverseText: '#F7EFDD',
    chart: ['#FFD400', '#1A1A1A', '#6B6350', '#F7EFDD'],
  },
  type: {
    heading: 'var(--font-fraunces), serif',
    body: 'var(--font-hedvig-sans), sans-serif',
    headingWeight: 600,
    headingCase: 'none',
    headingTracking: 'normal',
    scale: { h1: 30, h2: 22, body: 16 },
  },
  space: { slidePad: '40px 46px', gap: 14 },
  surfaces: {
    slideRadius: 8,
    cover: {
      kind: 'pattern',
      background: '#FFD400',
      fg: '#1A1A1A',
      // Black ink-speckle over yellow, approximating the reference's
      // hand-drawn splatter corners — kept faint so it reads as paper grain
      // behind the title rather than competing with it for attention.
      pattern: 'radial-gradient(rgba(26,26,26,0.16) 1.2px, transparent 1.4px)',
      patternSize: '15px 15px',
    },
    // Thin black hairline borders — the weight of the reference's line-art
    // illustrations, not a soft muted gray.
    card: { bg: '#F0E4C8', border: '1px solid #1A1A1A', radius: 8, shadow: 'none' },
  },
  data: { style: 'big-number', valueColor: '#1A1A1A' },
  image: { radius: 8, frame: 'none', filter: 'none' },
  layouts: {
    divider: { surface: 'accent', align: 'left' },
    closing: { align: 'center' },
  },
}
