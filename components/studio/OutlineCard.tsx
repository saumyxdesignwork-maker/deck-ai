'use client'

import { CheckCircle2, RefreshCw, Sparkles } from 'lucide-react'
import { OutlineSection } from '@/lib/studioScript'

interface OutlineCardProps {
  sections: OutlineSection[]
  approved?: boolean
  onApprove: () => void
  onRegenerate: () => void
}

export function OutlineCard({ sections, approved, onApprove, onRegenerate }: OutlineCardProps) {
  // Already approved — compact confirmation, matching ClarifyCard's answered state
  if (approved) {
    return (
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          padding: '10px 14px',
          fontSize: 12,
          color: 'var(--text)',
          fontFamily: 'var(--font-body)',
        }}
      >
        <CheckCircle2 size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />
        Outline approved — {sections.length} sections
      </div>
    )
  }

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        background: 'var(--surface)',
        boxShadow: 'var(--sh-1)',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--divider)' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
          Review the storyline
        </span>
        <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '2px 0 0', fontFamily: 'var(--font-body)' }}>
          This is the section flow I'll build slides from — approve it or ask for changes below.
        </p>
      </div>

      {/* No inner scroll here on purpose — nesting a scrollable box inside the
          chat pane's own scroll made the "Generate Slides" button below hard
          to reach (users would get stuck scrolling this box and never see it). */}
      <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sections.map((section, i) => (
          <div key={i} style={{ display: 'flex', gap: 10 }}>
            <div
              style={{
                width: 20, height: 20, borderRadius: '50%',
                border: '1.5px solid var(--accent)', color: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 1,
              }}
            >
              {i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-heading)', marginBottom: 4 }}>
                {section.title}
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {section.bullets.map((bullet, bi) => (
                  <li key={bi} style={{ display: 'flex', gap: 6, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--accent)', flexShrink: 0 }}>•</span>
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '10px 16px', borderTop: '1px solid var(--divider)' }}>
        <button
          onClick={onRegenerate}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 'var(--r-pill)',
            border: '1px solid var(--border)', background: 'transparent',
            fontSize: 12.5, color: 'var(--text-muted)', cursor: 'pointer',
            fontFamily: 'var(--font-body)',
          }}
        >
          <RefreshCw size={12} />
          Regenerate
        </button>
        <button
          onClick={onApprove}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 16px', borderRadius: 'var(--r-pill)',
            border: 'none', background: 'var(--primary)', color: 'var(--primary-fg)',
            fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'var(--font-body)',
          }}
        >
          <Sparkles size={12} />
          Generate Slides
        </button>
      </div>
    </div>
  )
}
