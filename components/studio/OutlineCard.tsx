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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, padding: '14px 16px 12px' }}>
        <div>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
            Review the storyline
          </span>
          <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '3px 0 0', lineHeight: 1.5, fontFamily: 'var(--font-body)' }}>
            This is the section flow I'll build slides from — approve it or ask for changes below.
          </p>
        </div>
        <span
          style={{
            flexShrink: 0,
            padding: '3px 9px',
            borderRadius: 'var(--r-pill)',
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
            fontSize: 11,
            fontWeight: 600,
            fontFamily: 'var(--font-body)',
            whiteSpace: 'nowrap',
          }}
        >
          {sections.length} sections
        </span>
      </div>

      {/* Section list — each a distinct row inside one inset panel, not a bare
          scrollable list. No inner scroll/max-height here on purpose: nesting
          a scrollable box inside the chat pane's own scroll made the CTA row
          below hard to reach (users would get stuck scrolling this box and
          never see it). */}
      <div style={{ margin: '0 16px 14px', padding: 8, borderRadius: 'var(--r-md)', background: 'var(--surface-muted)', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sections.map((section, i) => (
          <div
            key={i}
            style={{
              display: 'flex', gap: 10,
              padding: '10px 10px',
              borderRadius: 'var(--r-sm)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
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

      {/* CTA row — always the last thing in the card, directly below the list */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 16px', borderTop: '1px solid var(--divider)', background: 'var(--surface-muted)' }}>
        <button
          onClick={onRegenerate}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '9px 14px', borderRadius: 'var(--r-pill)',
            border: '1px solid var(--border)', background: 'var(--surface)',
            fontSize: 12.5, color: 'var(--text-muted)', cursor: 'pointer',
            fontFamily: 'var(--font-body)', flexShrink: 0,
          }}
        >
          <RefreshCw size={13} />
          Regenerate
        </button>
        <button
          onClick={onApprove}
          style={{
            flex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '9px 16px', borderRadius: 'var(--r-pill)',
            border: 'none', background: 'var(--primary)', color: 'var(--primary-fg)',
            fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'var(--font-body)', boxShadow: 'var(--sh-1)',
          }}
        >
          <Sparkles size={13} />
          Generate Slides
        </button>
      </div>
    </div>
  )
}
