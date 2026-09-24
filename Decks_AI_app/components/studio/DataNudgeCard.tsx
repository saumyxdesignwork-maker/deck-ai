'use client'

import { Database, ClipboardPaste } from 'lucide-react'
import { GoogleSheetsIcon, GoogleDocsIcon, SlackIcon } from '@/components/shared/BrandIcons'
import type { ConnectStep } from './DataConnectPanel'

const CONNECTOR_CTAS = [
  { key: 'sheets' as ConnectStep, icon: GoogleSheetsIcon, label: 'Google Sheets', enabled: true },
  { key: 'paste' as ConnectStep, icon: ClipboardPaste, label: 'Paste / Upload', enabled: true },
  { key: 'providers' as ConnectStep, icon: GoogleDocsIcon, label: 'Google Docs', enabled: false },
  { key: 'providers' as ConnectStep, icon: SlackIcon, label: 'Slack', enabled: false },
]

interface DataNudgeCardProps {
  onOpenConnectors: (initialStep?: ConnectStep) => void
}

/** A standalone, explicit call-to-action — separate from the clarify
 * question flow — offering to ground the deck in real data via a specific
 * connector. Each button jumps straight to that connector's step in
 * DataConnectPanel; the two "coming soon" ones open the provider list where
 * that's shown, rather than pretending to be live. */
export function DataNudgeCard({ onOpenConnectors }: DataNudgeCardProps) {
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
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px 10px' }}>
        <div style={{ width: 26, height: 26, borderRadius: 'var(--r-sm)', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Database size={13} style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
            Ground this deck in real data?
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginTop: 2 }}>
            Connect a source and I'll use its actual figures — and call out anything it doesn't cover instead of guessing.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '0 16px 14px' }}>
        {CONNECTOR_CTAS.map(({ key, icon: Icon, label, enabled }) => (
          <button
            key={label}
            onClick={() => onOpenConnectors(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px',
              borderRadius: 'var(--r-pill)',
              border: '1px solid var(--border)',
              background: enabled ? 'var(--surface-muted)' : 'var(--surface)',
              // text-disabled reads as near-invisible against these dark
              // surfaces — text-muted keeps the label actually legible while
              // still reading as secondary/inactive next to the enabled
              // buttons' full-strength text color.
              color: enabled ? 'var(--text)' : 'var(--text-muted)',
              fontSize: 12, fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              whiteSpace: 'nowrap',
            }}
            title={enabled ? undefined : 'Coming soon'}
          >
            <Icon size={12} />
            {label}
            {!enabled && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>· soon</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
