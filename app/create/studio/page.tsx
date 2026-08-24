'use client'

import { useEffect, useState } from 'react'
import { ControlsPanel } from '@/components/controls/ControlsPanel'
import { useTheme } from '@/components/controls/ThemeProvider'
import { useCreate } from '@/lib/createContext'
import { StudioLanding } from '@/components/studio/StudioLanding'
import { StudioSession } from '@/components/studio/StudioSession'

type Phase = 'landing' | 'session'

export default function StudioPage() {
  const { vl, flow, setFlow } = useTheme()
  const { setInput } = useCreate()
  const [phase, setPhase] = useState<Phase>('landing')
  const [prompt, setPrompt] = useState('')
  const isVL3 = vl === '3'

  // Keep the Controls "Create Flow" pill in sync if this route is reached directly.
  useEffect(() => {
    if (flow !== 'studio') setFlow('studio')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = (text: string) => {
    setInput(text)
    setPrompt(text)
    setPhase('session')
  }

  const handleBackToLanding = () => {
    setPhase('landing')
    setPrompt('')
  }

  if (phase === 'session') {
    return (
      <>
        <StudioSession initialPrompt={prompt} onBackToLanding={handleBackToLanding} />
        <ControlsPanel />
      </>
    )
  }

  const landing = <StudioLanding onSubmit={handleSubmit} />

  return (
    <>
      {isVL3 ? (
        <div style={{ padding: 'var(--window-inset)', height: '100vh', boxSizing: 'border-box', background: 'transparent' }}>
          <div
            data-glass
            style={{
              height: '100%',
              borderRadius: 'var(--r-window)',
              overflow: 'hidden',
              boxShadow: 'var(--sh-3)',
              border: '1px solid var(--border)',
              background: 'var(--surface-panel, var(--surface))',
            }}
          >
            {landing}
          </div>
        </div>
      ) : (
        <div style={{ height: '100vh', overflow: 'hidden', background: 'var(--bg-canvas)' }}>
          {landing}
        </div>
      )}
      <ControlsPanel />
    </>
  )
}
