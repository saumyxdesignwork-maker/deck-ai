import localFont from 'next/font/local'

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
