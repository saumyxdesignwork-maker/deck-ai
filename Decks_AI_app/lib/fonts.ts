import localFont from 'next/font/local'
import { Bricolage_Grotesque, Source_Serif_4, IBM_Plex_Sans, IBM_Plex_Mono, Fraunces, Anton } from 'next/font/google'

export const hedvigSerif = localFont({
  src: '../public/fonts/hedvig/HedvigLettersSerif-Variable.ttf',
  variable: '--font-hedvig-serif',
  display: 'swap',
  preload: true,
})

export const hedvigSans = localFont({
  src: '../public/fonts/hedvig/HedvigLettersSans-Regular.ttf',
  variable: '--font-hedvig-sans',
  display: 'swap',
  preload: true,
})

export const geist = localFont({
  src: '../public/fonts/geist/Geist-Variable.ttf',
  variable: '--font-geist',
  display: 'swap',
  preload: true,
})

export const instrumentSerif = localFont({
  src: '../public/fonts/instrument/InstrumentSerif-Regular.otf',
  variable: '--font-instrument-serif',
  display: 'swap',
  preload: true,
})

// Deck-template-only fonts below — not part of the app's own Style
// pill/visual-language fonts, so `preload: false`: the file only downloads
// once a slide actually uses a template that references it.
export const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage-grotesque',
  display: 'swap',
  preload: false,
})

export const sourceSerif4 = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif-4',
  display: 'swap',
  preload: false,
})

export const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-plex-sans',
  display: 'swap',
  preload: false,
})

export const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['500'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
  preload: false,
})

export const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  preload: false,
})

// Single-weight display face (always reads as black/bold) — Noir's
// condensed-poster headline (see templates/noir.ts).
export const anton = Anton({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-anton',
  display: 'swap',
  preload: false,
})
