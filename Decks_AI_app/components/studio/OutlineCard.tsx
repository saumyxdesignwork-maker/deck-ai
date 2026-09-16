'use client'

import { CheckCircle2, ListChecks, ArrowRight } from 'lucide-react'

interface OutlineCardProps {
  sectionCount: number
  approved?: boolean
}

// Compact chat-pane indicator only — the interactive review (section list +
// Generate Slides / Rethink Storyline) lives in the preview pane on the
// right, where there's room to actually read it.
export function OutlineCard({ sectionCount, approved }: OutlineCardProps) {
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
        Outline approved — {sectionCount} sections
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--accent-soft)',
        border: '1px solid rgba(30,123,255,0.18)',
        borderRadius: 'var(--r-md)',
        padding: '10px 14px',
        fontSize: 12,
        color: 'var(--accent)',
        fontFamily: 'var(--font-body)',
        fontWeight: 500,
      }}
    >
      <ListChecks size={14} style={{ flexShrink: 0 }} />
      I've drafted a storyline — review it on the right
      <ArrowRight size={12} style={{ marginLeft: 'auto', flexShrink: 0 }} />
    </div>
  )
}
