'use client'

import { RefreshCw, Sparkles, ListChecks } from 'lucide-react'
import { OutlineSection } from '@/lib/studioScript'

interface OutlineReviewPanelProps {
  sections: OutlineSection[]
  onApprove: () => void
  onRegenerate: () => void
}

// The interactive storyline review — lives in the preview pane (not the
// chat) so there's room to actually read the section flow before slides
// get built. No inner scroll on the section list on purpose: it sits
// inside the canvas's own scroll container, so nesting a second scrollable
// box here would trap scrolling and make the CTA row below hard to reach.
export function OutlineReviewPanel({ sections, onApprove, onRegenerate }: OutlineReviewPanelProps) {
  return (
    <div
      style={{
        width: '100%',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-xl)',
        background: 'var(--surface)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '20px 24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div
            style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: 'var(--accent-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <ListChecks size={17} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-heading)', margin: 0 }}>
              Review the storyline
            </h2>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '3px 0 0', lineHeight: 1.5, fontFamily: 'var(--font-body)' }}>
              This is the section flow I'll build slides from — approve it, or ask for changes in the chat.
            </p>
          </div>
        </div>
        <span
          style={{
            flexShrink: 0,
            padding: '4px 11px',
            borderRadius: 'var(--r-pill)',
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'var(--font-body)',
            whiteSpace: 'nowrap',
          }}
        >
          {sections.length} sections
        </span>
      </div>

      {/* Section list */}
      <div style={{ margin: '0 24px 18px', padding: 10, borderRadius: 'var(--r-lg)', background: 'var(--surface-muted)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sections.map((section, i) => (
          <div
            key={i}
            style={{
              display: 'flex', gap: 12,
              padding: '14px 16px',
              borderRadius: 'var(--r-md)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                width: 24, height: 24, borderRadius: '50%',
                border: '1.5px solid var(--accent)', color: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 1,
              }}
            >
              {i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-heading)', marginBottom: 6 }}>
                {section.title}
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 3 }}>
                {section.bullets.map((bullet, bi) => (
                  <li key={bi} style={{ display: 'flex', gap: 7, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55 }}>
                    <span style={{ color: 'var(--accent)', flexShrink: 0 }}>•</span>
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* CTA row — always the last thing in the panel, directly below the list */}
      <div style={{ display: 'flex', gap: 10, padding: '16px 24px', borderTop: '1px solid var(--divider)', background: 'var(--surface-muted)' }}>
        <button
          onClick={onRegenerate}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '11px 18px', borderRadius: 'var(--r-pill)',
            border: '1px solid var(--border)', background: 'var(--surface)',
            fontSize: 13.5, color: 'var(--text-muted)', cursor: 'pointer',
            fontFamily: 'var(--font-body)', flexShrink: 0,
          }}
        >
          <RefreshCw size={14} />
          Rethink Storyline
        </button>
        <button
          onClick={onApprove}
          style={{
            flex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '11px 18px', borderRadius: 'var(--r-pill)',
            border: 'none', background: 'var(--primary)', color: 'var(--primary-fg)',
            fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'var(--font-body)', boxShadow: 'var(--sh-1)',
          }}
        >
          <Sparkles size={14} />
          Generate Slides
        </button>
      </div>
    </div>
  )
}
