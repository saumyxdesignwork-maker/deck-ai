import type { Metadata } from 'next'
import './globals.css'
import { hedvigSerif, hedvigSans, geist, instrumentSerif } from '@/lib/fonts'
import { ThemeProvider } from '@/components/controls/ThemeProvider'
import { CreateProvider } from '@/lib/createContext'

export const metadata: Metadata = {
  title: 'DeckAI — From Idea to Deck in 3 Minutes',
  description: 'AI-powered presentation generator for working professionals',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      data-vl="1"
      data-font="a"
      data-flow="classic"
      className={`${hedvigSerif.variable} ${hedvigSans.variable} ${geist.variable} ${instrumentSerif.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Tiffin Latin Variable — Adobe Typekit, Font Preset D */}
        <link rel="stylesheet" href="https://use.typekit.net/szp6iny.css" />
      </head>
      <body>
        <ThemeProvider>
          <CreateProvider>
            {children}
          </CreateProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
