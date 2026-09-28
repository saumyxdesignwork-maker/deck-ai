import type { DeckTemplate } from '../types'

/** A black, grunge-editorial direction modeled on the "Complex Collective /
 * Future of Influence" reference: near-black slides, a huge condensed
 * uppercase headline, a teal highlight accent alongside a purple stat
 * accent, gritty grayscale photography, and the same crop-mark corners as
 * Riso — this and Riso are the two "print report" templates, Riso in red,
 * Noir in black. */
export const noir: DeckTemplate = {
  id: 'noir',
  category: 'creative',
  name: 'Noir',
  blurb: 'Near-black, condensed uppercase display type, teal and purple flashes.',
  colors: {
    bg: '#0D0D0D',
    surfaceMuted: '#1A1A1A',
    text: '#F2F2F2',
    textMuted: '#9A9A9A',
    accent: '#1AA89A',
    accentSoft: '#123632',
    accentFg: '#0D0D0D',
    border: '#2A2A2A',
    inverseBg: '#F2F2F2',
    inverseText: '#0D0D0D',
    chart: ['#1AA89A', '#8B5CF6', '#F2F2F2', '#9A9A9A'],
  },
  type: {
    heading: 'var(--font-anton), sans-serif',
    body: 'var(--font-geist), sans-serif',
    headingWeight: 400,
    headingCase: 'uppercase',
    headingTracking: '0em',
    scale: { h1: 34, h2: 24, body: 15 },
  },
  space: { slidePad: '40px 46px', gap: 14 },
  surfaces: {
    slideRadius: 0,
    cover: { kind: 'solid', background: '#0D0D0D', fg: '#F2F2F2' },
    card: { bg: '#1A1A1A', border: '1px solid #2A2A2A', radius: 0, shadow: 'none' },
    texture: 'radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px)',
    textureSize: '7px 7px',
    cornerMarks: true,
  },
  // Purple for big stat numbers — a second accent alongside teal, echoing
  // the reference's "80%" purple-flash stat against its teal highlight bars.
  data: { style: 'big-number', valueColor: '#8B5CF6' },
  image: { radius: 0, frame: 'none', filter: 'grayscale(1) contrast(1.2) brightness(0.9)' },
  layouts: {
    divider: { align: 'left', headingScale: 1.3 },
    closing: { surface: 'inverse', align: 'center' },
  },
}
