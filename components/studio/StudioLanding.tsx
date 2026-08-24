'use client'

import { useState } from 'react'
import { Sparkles, Briefcase, Palette, RectangleHorizontal, Compass, Wand2 } from 'lucide-react'
import { Composer } from './Composer'
import { SUGGESTED_PROMPTS } from '@/lib/fixtures'

const MODE_PILLS = [
  { key: 'professional', icon: Briefcase, label: 'Professional' },
  { key: 'creative', icon: Palette, label: 'Creative' },
] as const

const TOGGLE_PILLS = [
  { key: 'autoRatio', icon: RectangleHorizontal, label: 'Auto Ratio' },
  { key: 'guideMode', icon: Compass, label: 'Guide Mode' },
] as const

interface StudioLandingProps {
  onSubmit: (prompt: string) => void
}

export function StudioLanding({ onSubmit }: StudioLandingProps) {
  const [mode, setMode] = useState<'professional' | 'creative'>('professional')
  const [toggles, setToggles] = useState<Record<string, boolean>>({ autoRatio: false, guideMode: false })

  const toggle = (key: string) => setToggles(prev => ({ ...prev, [key]: !prev[key] }))

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
            onClick={() => setMode(key)}
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
        {TOGGLE_PILLS.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => toggle(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 'var(--r-pill)',
              border: '1px solid',
              borderColor: toggles[key] ? 'var(--accent)' : 'var(--border)',
              background: toggles[key] ? 'var(--accent-soft)' : 'var(--surface-muted)',
              color: toggles[key] ? 'var(--accent)' : 'var(--text)',
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
      <div style={{ width: '100%', maxWidth: 660, marginBottom: 40 }}>
        <Composer onSubmit={onSubmit} placeholder="Enter your presentation topic and requirements…" variant="hero" />
      </div>

      {/* Templates */}
      <div style={{ width: '100%', maxWidth: 920 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
          <Sparkles size={14} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
            Try one of these
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
          {SUGGESTED_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => onSubmit(prompt)}
              style={{
                textAlign: 'left',
                padding: '14px 16px',
                borderRadius: 'var(--r-md)',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                cursor: 'pointer',
                fontSize: 12.5,
                color: 'var(--text)',
                lineHeight: 1.5,
                fontFamily: 'var(--font-body)',
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'var(--accent)'
                el.style.boxShadow = 'var(--sh-1)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'var(--border)'
                el.style.boxShadow = 'none'
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
