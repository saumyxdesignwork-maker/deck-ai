import type { DeckTemplate } from '../types'

/** The default corporate template — bold black type, deep violet as the one
 * structural color, teal reserved for data/timeline accents. Modeled on the
 * clean personal/portfolio-deck reference the user sent (purple title
 * blocks + teal timeline dots on white, generous whitespace, no ornament). */
export const meridian: DeckTemplate = {
  id: 'meridian',
  category: 'corporate',
  name: 'Meridian',
  blurb: 'Bold black type, violet and teal, clean white grid.',
  colors: {
    bg: '#FFFFFF',
    surfaceMuted: '#F5F3FA',
    text: '#0B0B0F',
    textMuted: '#6B7280',
    accent: '#5B21B6',
    accentSoft: '#EDE4FB',
    accentFg: '#FFFFFF',
    border: '#E5E1ED',
    inverseBg: '#0B0B0F',
    inverseText: '#FFFFFF',
    chart: ['#5B21B6', '#0F9B8E', '#0B0B0F', '#9CA3AF'],
  },
  type: {
    heading: 'var(--font-geist), sans-serif',
    body: 'var(--font-geist), sans-serif',
    headingWeight: 800,
    headingCase: 'none',
    headingTracking: 'normal',
    scale: { h1: 32, h2: 23, body: 16 },
  },
  space: { slidePad: '40px 46px', gap: 14 },
  surfaces: {
    slideRadius: 16,
    // Solid violet, matching the reference's flat purple title block — not
    // 'deck-color', since nothing in production depends on the old
    // gradient-blue look yet (no generated deck has a templateId today).
    cover: { kind: 'solid', background: '#5B21B6', fg: '#FFFFFF' },
    card: { bg: '#F5F3FA', border: '1px solid #E5E1ED', radius: 10, shadow: 'none' },
  },
  // Teal for stat values — a second accent, distinct from violet, matching
  // the reference's teal timeline dots against violet structural blocks.
  data: { style: 'plain', valueColor: '#0F9B8E' },
  image: { radius: 12, frame: 'none', filter: 'none' },
}
