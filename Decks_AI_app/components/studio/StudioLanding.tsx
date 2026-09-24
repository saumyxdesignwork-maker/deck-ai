'use client'

import { useEffect, useRef, useState } from 'react'
import { Sparkles, Layers, Briefcase, Palette, RectangleHorizontal, Square, Wand2 } from 'lucide-react'
import { Composer } from './Composer'
import { STUDIO_TEMPLATES, AspectRatio } from '@/lib/fixtures'
import { SERVICE_BASE_URL } from '@/lib/deckStream'
import { getSavedDecks, SavedDeck } from '@/lib/deckHistory'
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
  /** Reopens a deck from the "Your slides" tab. */
  onResume: (saved: SavedDeck) => void
}

/** Rough, dependency-free "3 days ago" / "Just now" formatting — decks are
 * created on a human timescale, no need for a full date library. */
function formatRelativeDate(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function StudioLanding({ onSubmit, onResume }: StudioLandingProps) {
  const [mode, setMode] = useState<DeckStyle>('professional')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9')
  const [promptValue, setPromptValue] = useState('')
  const [sendError, setSendError] = useState<string | null>(null)
  const composerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // "Your slides" only exists once there's something to show — reads once on
  // mount (a fresh save during this same visit only matters after a full
  // navigation back to this landing page anyway).
  const [savedDecks, setSavedDecks] = useState<SavedDeck[]>([])
  const [activeTab, setActiveTab] = useState<'try' | 'yours'>('try')
  useEffect(() => {
    setSavedDecks(getSavedDecks())
  }, [])

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

      {/* Templates / Your slides */}
      <div style={{ width: '100%', maxWidth: 920 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginBottom: 18, borderBottom: '1px solid var(--divider)' }}>
          <TabButton
            active={activeTab === 'try'}
            onClick={() => setActiveTab('try')}
            icon={Sparkles}
            label="Try these"
          />
          {/* Only exists once the user has actually finished a deck — before
              that there's nothing for it to show. */}
          {savedDecks.length > 0 && (
            <TabButton
              active={activeTab === 'yours'}
              onClick={() => setActiveTab('yours')}
              icon={Layers}
              label="Your slides"
              count={savedDecks.length}
            />
          )}
        </div>

        {activeTab === 'try' ? (
          // Exactly 6 cards, one real thumbnail each — 3 per row so they read
          // left-to-right, top-to-bottom in the same order as the thumbnails.
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
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
            {savedDecks.map(saved => (
              <button
                key={saved.sessionId}
                type="button"
                onClick={() => onResume(saved)}
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
                <div
                  style={{
                    aspectRatio: '16 / 9', overflow: 'hidden',
                    background: saved.deck.coverColor || 'var(--surface-muted)',
                    display: 'flex', alignItems: 'center', padding: '14px 16px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15,
                      color: 'white', lineHeight: 1.3,
                      display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}
                  >
                    {saved.title}
                  </span>
                </div>
                <span style={{ padding: '12px 14px 4px', fontSize: 12.5, color: 'var(--text)', lineHeight: 1.5 }}>
                  {saved.prompt}
                </span>
                <span style={{ padding: '0 14px 12px', fontSize: 11.5, color: 'var(--text-muted)' }}>
                  {formatRelativeDate(saved.createdAt)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TabButton({
  active, onClick, icon: Icon, label, count,
}: {
  active: boolean
  onClick: () => void
  icon: React.ElementType
  label: string
  count?: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '0 0 10px', marginBottom: -1,
        border: 'none', borderBottom: '2px solid',
        borderColor: active ? 'var(--accent)' : 'transparent',
        background: 'transparent', cursor: 'pointer',
        fontSize: 13, fontWeight: active ? 600 : 500,
        color: active ? 'var(--text)' : 'var(--text-muted)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <Icon size={14} style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }} />
      {label}
      {count !== undefined && (
        <span
          style={{
            fontSize: 11, fontWeight: 600, color: active ? 'var(--accent)' : 'var(--text-disabled)',
            background: 'var(--surface-muted)', borderRadius: 'var(--r-pill)', padding: '1px 6px',
          }}
        >
          {count}
        </span>
      )}
    </button>
  )
}
