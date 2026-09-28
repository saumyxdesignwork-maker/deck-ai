import type { DeckTemplate } from '../types'

/** A second corporate direction — navy, cream and gold, serif display type.
 * Modeled on the "Consulting Proposal" reference: a dark navy cover with a
 * serif title, cream content pages, gold reserved for the one highlighted
 * row (deliverables, key numbers) rather than spread everywhere. */
export const ledger: DeckTemplate = {
  id: 'ledger',
  category: 'corporate',
  name: 'Ledger',
  blurb: 'Navy and gold on cream, serif display type, boardroom-serious.',
  colors: {
    bg: '#F7F4EC',
    surfaceMuted: '#EDE7D8',
    text: '#1F2A33',
    textMuted: '#5B6670',
    accent: '#B8862E',
    accentSoft: '#F5E6C4',
    accentFg: '#1F2A33',
    border: '#DCD5C2',
    inverseBg: '#2E3740',
    inverseText: '#F7F4EC',
    chart: ['#B8862E', '#2E3740', '#5B6670', '#F7F4EC'],
  },
  type: {
    heading: 'var(--font-source-serif-4), serif',
    body: 'var(--font-geist), sans-serif',
    numeric: 'var(--font-source-serif-4), serif',
    headingWeight: 600,
    headingCase: 'none',
    headingTracking: 'normal',
    scale: { h1: 34, h2: 24, body: 16 },
  },
  space: { slidePad: '40px 48px', gap: 14 },
  surfaces: {
    slideRadius: 4,
    cover: { kind: 'solid', background: '#2E3740', fg: '#F7F4EC' },
    card: { bg: '#EDE7D8', border: '1px solid #DCD5C2', radius: 4, shadow: 'none' },
  },
  data: { style: 'boxed', valueColor: '#B8862E' },
  image: { radius: 2, frame: '1px solid #DCD5C2', filter: 'grayscale(0.15)' },
  layouts: {
    // Full-bleed navy divider/closing — matches the reference's dark
    // "Understanding the market" section-break slide dropped between cream pages.
    divider: { surface: 'inverse', align: 'left' },
    closing: { surface: 'inverse', align: 'center' },
  },
}
