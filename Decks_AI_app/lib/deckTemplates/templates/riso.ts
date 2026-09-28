import type { DeckTemplate } from '../types'

/** The creative reference build — a bold, print-technical style modeled on
 * the "Geist*Studio" impact-report reference: true red and black, huge
 * uppercase display type, ink-bordered cards with a hard offset shadow, a
 * faint print-grain texture, and crop-mark corners on every slide. */
export const riso: DeckTemplate = {
  id: 'riso',
  category: 'creative',
  name: 'Riso',
  blurb: 'True red and black, huge uppercase type, print-technical and bold.',
  colors: {
    bg: '#F7F5F2',
    surfaceMuted: '#ECE9E3',
    text: '#111111',
    textMuted: '#5A5A5A',
    accent: '#F20000',
    accentSoft: '#FFE0E0',
    // Black text on red — the reference never puts white on its red slides.
    accentFg: '#111111',
    border: '#111111',
    inverseBg: '#111111',
    inverseText: '#F7F5F2',
    chart: ['#F20000', '#111111', '#5A5A5A', '#F7F5F2'],
  },
  type: {
    heading: 'var(--font-bricolage-grotesque), sans-serif',
    body: 'var(--font-hedvig-sans), sans-serif',
    numeric: 'var(--font-bricolage-grotesque), sans-serif',
    headingWeight: 800,
    headingCase: 'uppercase',
    headingTracking: '-0.03em',
    scale: { h1: 32, h2: 22, body: 15 },
  },
  space: { slidePad: '38px 44px', gap: 12 },
  surfaces: {
    slideRadius: 0,
    cover: { kind: 'solid', background: '#F20000', fg: '#111111' },
    card: { bg: '#F7F5F2', border: '2px solid #111111', radius: 0, shadow: '4px 4px 0 #111111' },
    // Faint dot grain — print-report texture, not decoration you'd notice
    // unless you looked for it.
    texture: 'radial-gradient(rgba(17,17,17,0.05) 1px, transparent 1px)',
    textureSize: '9px 9px',
    cornerMarks: true,
  },
  data: { style: 'big-number', valueColor: '#F20000' },
  image: { radius: 0, frame: '2px solid #111111', filter: 'grayscale(1) contrast(1.15)' },
  layouts: {
    divider: { surface: 'accent', align: 'left', headingScale: 1.3 },
    closing: { surface: 'inverse', align: 'center' },
  },
}
