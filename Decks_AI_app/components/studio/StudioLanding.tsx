'use client'

import { useRef, useState } from 'react'
import { Sparkles, Briefcase, Palette, RectangleHorizontal, Square, Wand2 } from 'lucide-react'
import { Composer } from './Composer'
import { STUDIO_TEMPLATES, AspectRatio } from '@/lib/fixtures'
import { SERVICE_BASE_URL } from '@/lib/deckStream'
import type { DeckStyle } from '@/lib/useStudioSession'

export type { DeckStyle }

const PREFLIGHT_TIMEOUT_MS = 8000
export const SERVICE_UNREACHABLE_MESSAGE = "Couldn't reach the deck service. Check your connection and try again."

/** Quick reachability check before leaving the creation screen, so a dead
 * backend surfaces as an inline error here (prompt kept) instead of an
 * empty session. */
async function checkServiceReachable(): Promise<boolean> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), PREFLIGHT_TIMEOUT_MS)
  try {
    const res = await fetch(`${SERVICE_BASE_URL}/health`, { signal: ctrl.signal })
    return res.ok
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

const MODE_PILLS = [
  { key: 'professional', icon: Briefcase, label: 'Professional' },
  { key: 'creative', icon: Palette, label: 'Creative' },
] as const

const RATIO_OPTIONS = [
  { key: '16:9' as AspectRatio, icon: RectangleHorizontal, label: '16:9' },
  { key: '4:3' as AspectRatio, icon: Square, label: '4:3' },
]

interface StudioLandingProps {
  onSubmit: (prompt: string, aspectRatio: AspectRatio, style: DeckStyle) => void
}

export function StudioLanding({ onSubmit }: StudioLandingProps) {
  const [mode, setMode] = useState<DeckStyle>('professional')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9')
  const [promptValue, setPromptValue] = useState('')
  const [sendError, setSendError] = useState<string | null>(null)
  const composerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Template click only fills the composer — the user still has to hit Send
  // to start. Focus moves into the field (caret at the end) so a keyboard
  // user can edit or send straight away.
  const fillFromTemplate = (prompt: string) => {
    setPromptValue(prompt)
    setSendError(null)
    composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    requestAnimationFrame(() => {
      const el = inputRef.current
      if (!el) return
      el.focus()
      el.setSelectionRange(prompt.length, prompt.length)
    })
  }

  const handleSend = async (text: string) => {
    setSendError(null)
    const ok = await checkServiceReachable()
    if (!ok) {
      setSendError(SERVICE_UNREACHABLE_MESSAGE)
      return false
    }
    onSubmit(text, aspectRatio, mode)
    return true
  }

  return (
    <div
      style={{
        height: '100%',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '64px 24px 48px',
      }}
    >
      {/* Hero */}
      <div style={{ textAlign: 'center', maxWidth: 560, marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Wand2 size={15} color="white" />
          </div>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>
            DeckAI Studio
          </span>
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 30,
            fontWeight: 700,
            color: 'var(--text)',
            marginBottom: 10,
            lineHeight: 1.2,
          }}
        >
          What deck are we building today?
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.55 }}>
          Describe it in a sentence — I&rsquo;ll ask a quick clarifying question, then build the whole deck.
        </p>
      </div>

      {/* Mode pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        {MODE_PILLS.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            aria-pressed={mode === key}
            className="dk-select dk-focus-ring"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 'var(--r-pill)',
              border: '1px solid',
              borderColor: mode === key ? 'var(--accent)' : 'var(--border)',
              background: mode === key ? 'var(--accent-soft)' : 'var(--surface-muted)',
              color: mode === key ? 'var(--accent)' : 'var(--text)',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
              fontFamily: 'var(--font-body)',
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
        <span style={{ width: 1, height: 18, background: 'var(--divider)' }} />
        {RATIO_OPTIONS.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setAspectRatio(key)}
            aria-pressed={aspectRatio === key}
            aria-label={`${label} aspect ratio`}
            title={`Generate every slide in ${label}`}
            className="dk-select dk-focus-ring"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 'var(--r-pill)',
              border: '1px solid',
              borderColor: aspectRatio === key ? 'var(--accent)' : 'var(--border)',
              background: aspectRatio === key ? 'var(--accent-soft)' : 'var(--surface-muted)',
              color: aspectRatio === key ? 'var(--accent)' : 'var(--text)',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
              fontFamily: 'var(--font-body)',
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Composer */}
      <div ref={composerRef} style={{ width: '100%', maxWidth: 660, marginBottom: 40 }}>
        <Composer
          onSubmit={handleSend}
          value={promptValue}
          onChange={v => { setPromptValue(v); if (sendError) setSendError(null) }}
          placeholder="Enter your presentation topic and requirements…"
          variant="hero"
          inputRef={inputRef}
          errorMessage={sendError}
          pendingLabel="Starting your deck…"
        />
      </div>

      {/* Templates */}
      <div style={{ width: '100%', maxWidth: 920 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
          <Sparkles size={14} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
            Try one of these
          </span>
        </div>
        {/* Exactly 6 cards, one real thumbnail each — 3 per row so they read
            left-to-right, top-to-bottom in the same order as the thumbnails. */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
          {STUDIO_TEMPLATES.map(({ prompt, thumbnail }, i) => (
            <button
              key={i}
              type="button"
              onClick={() => fillFromTemplate(prompt)}
              className="dk-lift"
              style={{
                textAlign: 'left',
                borderRadius: 'var(--r-md)',
                background: 'var(--surface)',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ aspectRatio: '16 / 9', overflow: 'hidden', background: 'var(--surface-muted)' }}>
                {/* Decorative — the button's accessible name comes from the
                    prompt text below, not this image. */}
                <img
                  src={thumbnail}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
              <span style={{ padding: '12px 14px', fontSize: 12.5, color: 'var(--text)', lineHeight: 1.5 }}>
                {prompt}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
