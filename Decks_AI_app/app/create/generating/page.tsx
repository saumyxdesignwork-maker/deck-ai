'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, PartyPopper, Sparkles } from 'lucide-react'
import { useGlassCard } from '@/lib/useGlassCard'
import { useTheme } from '@/components/controls/ThemeProvider'

type StepStatus = 'pending' | 'active' | 'done'

interface Step {
  id: string
  label: string
  detail: string
  status: StepStatus
}

const STEPS_INIT: Step[] = [
  { id: 'storyline', label: 'Storyline', detail: 'Structuring your narrative arc…', status: 'active' },
  { id: 'content', label: 'Content', detail: 'Writing sections and blocks…', status: 'pending' },
  { id: 'imagery', label: 'Imagery', detail: 'Selecting visuals for each slide…', status: 'pending' },
  { id: 'finalizing', label: 'Finalizing', detail: 'Polishing layout and spacing…', status: 'pending' },
]

const STEP_DURATIONS = [900, 1400, 1600, 1200]

export default function GeneratingPage() {
  const router = useRouter()
  const [steps, setSteps] = useState<Step[]>(STEPS_INIT)
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const glassClass = useGlassCard()
  const { vl } = useTheme()
  const isGlass = vl === '2'

  useEffect(() => {
    let elapsed = 0
    const stepIndices = [0, 1, 2, 3]

    stepIndices.forEach((idx, i) => {
      const startDelay = STEP_DURATIONS.slice(0, i).reduce((a, b) => a + b, 0)
      const endDelay = STEP_DURATIONS.slice(0, i + 1).reduce((a, b) => a + b, 0)

      // Activate step
      setTimeout(() => {
        setSteps((prev) =>
          prev.map((s, j) =>
            j === idx ? { ...s, status: 'active' } : j < idx ? { ...s, status: 'done' } : s
          )
        )
        setProgress(Math.round((i / 4) * 85))
      }, startDelay)

      // Mark done
      setTimeout(() => {
        setSteps((prev) =>
          prev.map((s, j) => (j === idx ? { ...s, status: 'done' } : s))
        )
        setProgress(Math.round(((i + 1) / 4) * 100))
        if (i === 3) {
          setTimeout(() => {
            setDone(true)
            setShowToast(true)
            setTimeout(() => router.push('/editor'), 1800)
          }, 300)
        }
      }, endDelay)
    })
  }, [router])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-canvas)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 32,
        padding: 24,
        position: 'relative',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Sparkles size={16} color="white" />
        </div>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 17, color: 'var(--text)' }}>
          DeckAI
        </span>
      </div>

      {/* Card */}
      <div
        className={glassClass}
        style={{
          // VL2: glass classes handle bg, border, shadow
          background: isGlass ? undefined : 'var(--surface)',
          border: isGlass ? 'none' : '1px solid var(--border)',
          boxShadow: isGlass ? undefined : 'var(--sh-2)',
          borderRadius: 'var(--r-xl)',
          padding: '32px 40px',
          width: '100%',
          maxWidth: 440,
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--text)',
            marginBottom: 6,
          }}
        >
          {done ? '✨ Your deck is ready!' : 'Building your deck…'}
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
          {done ? 'Taking you to the editor now.' : 'This usually takes under 90 seconds.'}
        </p>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {steps.map((step) => (
            <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Status icon */}
              <div style={{ width: 24, height: 24, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {step.status === 'done' && (
                  <CheckCircle2 size={20} style={{ color: 'var(--success)' }} />
                )}
                {step.status === 'active' && (
                  <Loader2 size={20} style={{ color: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
                )}
                {step.status === 'pending' && (
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: 'var(--border)',
                      margin: '0 6px',
                    }}
                  />
                )}
              </div>

              {/* Labels */}
              <div style={{ flex: 1 }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: step.status !== 'pending' ? 600 : 400,
                    color: step.status === 'pending' ? 'var(--text-muted)' : 'var(--text)',
                    display: 'block',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {step.label}
                </span>
                {step.status === 'active' && (
                  <span
                    className="animate-fade-in"
                    style={{ fontSize: 11, color: 'var(--text-muted)' }}
                  >
                    {step.detail}
                  </span>
                )}
                {step.status === 'done' && (
                  <span style={{ fontSize: 11, color: 'var(--success)' }}>Done</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div
          style={{
            marginTop: 24,
            height: 4,
            borderRadius: 'var(--r-pill)',
            background: 'var(--surface-muted)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: done ? 'var(--success)' : 'var(--accent)',
              borderRadius: 'var(--r-pill)',
              transition: 'width 0.6s ease, background 0.3s',
            }}
          />
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, textAlign: 'right' }}>
          {progress}%
        </p>
      </div>

      {/* Toast */}
      {showToast && (
        <div
          className="animate-slide-up"
          style={{
            position: 'fixed',
            bottom: 28,
            right: 28,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 18px',
            borderRadius: 'var(--r-md)',
            background: 'var(--primary)',
            color: 'var(--primary-fg)',
            boxShadow: 'var(--sh-3)',
            fontSize: 13,
            fontWeight: 500,
            fontFamily: 'var(--font-body)',
          }}
        >
          <PartyPopper size={16} />
          Deck created! Opening editor…
        </div>
      )}

      {/* Controls */}
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          left: 20,
        }}
      >
        {/* ControlsPanel rendered inline from layout — but we don't have AppLayout here */}
        {/* Inline mini version */}
      </div>
    </div>
  )
}
