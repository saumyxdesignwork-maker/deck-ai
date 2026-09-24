'use client'

import { useEffect, useState } from 'react'
import { MotionConfig } from 'motion/react'
import { ControlsPanel } from '@/components/controls/ControlsPanel'
import { useTheme } from '@/components/controls/ThemeProvider'
import { useCreate } from '@/lib/createContext'
import { StudioLanding, DeckStyle } from '@/components/studio/StudioLanding'
import { StudioSession } from '@/components/studio/StudioSession'
import { AspectRatio } from '@/lib/fixtures'
import { SavedDeck } from '@/lib/deckHistory'

type Phase = 'landing' | 'session'

export default function StudioPage() {
  const { flow, setFlow } = useTheme()
  const { setInput } = useCreate()
  const [phase, setPhase] = useState<Phase>('landing')
  const [prompt, setPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9')
  const [deckStyle, setDeckStyle] = useState<DeckStyle>('professional')
  const [resumeDeck, setResumeDeck] = useState<SavedDeck | undefined>(undefined)

  // Keep the Controls "Create Flow" pill in sync if this route is reached directly.
  useEffect(() => {
    if (flow !== 'studio') setFlow('studio')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = (text: string, ratio: AspectRatio, style: DeckStyle) => {
    setInput(text)
    setPrompt(text)
    setAspectRatio(ratio)
    setDeckStyle(style)
    setResumeDeck(undefined)
    setPhase('session')
  }

  // "Your slides" tab on the landing page — reopen a previously-finished
  // deck instead of generating a new one.
  const handleResume = (saved: SavedDeck) => {
    setInput(saved.prompt)
    setPrompt(saved.prompt)
    setAspectRatio(saved.aspectRatio)
    setResumeDeck(saved)
    setPhase('session')
  }

  const handleBackToLanding = () => {
    setPhase('landing')
    setPrompt('')
    setResumeDeck(undefined)
  }

  // reducedMotion="user": every Motion animation in Studio honors
  // prefers-reduced-motion (no travel/scale; state changes stay immediate).
  if (phase === 'session') {
    return (
      <MotionConfig reducedMotion="user">
        <StudioSession
          initialPrompt={prompt}
          aspectRatio={aspectRatio}
          deckStyle={deckStyle}
          resumeDeck={resumeDeck}
          onBackToLanding={handleBackToLanding}
        />
        <ControlsPanel />
      </MotionConfig>
    )
  }

  return (
    <MotionConfig reducedMotion="user">
      <div style={{ height: '100vh', overflow: 'hidden', background: 'var(--bg-canvas)' }}>
        <StudioLanding onSubmit={handleSubmit} onResume={handleResume} />
      </div>
      <ControlsPanel />
    </MotionConfig>
  )
}
