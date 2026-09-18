'use client'

import { useEffect, useState } from 'react'
import { ControlsPanel } from '@/components/controls/ControlsPanel'
import { useTheme } from '@/components/controls/ThemeProvider'
import { useCreate } from '@/lib/createContext'
import { StudioLanding } from '@/components/studio/StudioLanding'
import { StudioSession } from '@/components/studio/StudioSession'
import { AspectRatio } from '@/lib/fixtures'

type Phase = 'landing' | 'session'

export default function StudioPage() {
  const { flow, setFlow } = useTheme()
  const { setInput } = useCreate()
  const [phase, setPhase] = useState<Phase>('landing')
  const [prompt, setPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9')

  // Keep the Controls "Create Flow" pill in sync if this route is reached directly.
  useEffect(() => {
    if (flow !== 'studio') setFlow('studio')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = (text: string, ratio: AspectRatio) => {
    setInput(text)
    setPrompt(text)
    setAspectRatio(ratio)
    setPhase('session')
  }

  const handleBackToLanding = () => {
    setPhase('landing')
    setPrompt('')
  }

  if (phase === 'session') {
    return (
      <>
        <StudioSession initialPrompt={prompt} aspectRatio={aspectRatio} onBackToLanding={handleBackToLanding} />
        <ControlsPanel />
      </>
    )
  }

  return (
    <>
      <div style={{ height: '100vh', overflow: 'hidden', background: 'var(--bg-canvas)' }}>
        <StudioLanding onSubmit={handleSubmit} />
      </div>
      <ControlsPanel />
    </>
  )
}
