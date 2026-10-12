'use client'

import { useState } from 'react'
import { Bell, BellRing, X } from 'lucide-react'

interface NotifyToggleProps {
  enabled: boolean
  supported: boolean
  onToggle: () => void
}

/**
 * "Get notified when your task is ready" — a persistent flap above the
 * composer (same anchoring as the clarify flap in ChatPane), not a chat
 * item, so it stays reachable without scrolling. Turning it on requests a
 * real browser Notification permission and fires a genuine OS notification
 * when generation finishes (see useStudioSession's `notifyEnabled`) — this
 * is not cosmetic.
 */
export function NotifyToggle({ enabled, supported, onToggle }: NotifyToggleProps) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px',
        border: '1px solid var(--border)',
        borderBottom: 'none',
        borderRadius: 'var(--r-lg) var(--r-lg) 0 0',
        background: 'var(--surface-panel, var(--surface))',
      }}
    >
      {enabled ? <BellRing size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} /> : <Bell size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
      <span style={{ flex: 1, fontSize: 12.5, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
        {supported
          ? enabled
            ? "We'll notify you when your deck is ready."
            : 'Get notified when your task is ready.'
          : "Notifications aren't supported in this browser."}
      </span>

      {supported && (
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={enabled}
          style={{
            padding: '4px 11px', borderRadius: 'var(--r-pill)',
            border: '1px solid', borderColor: enabled ? 'var(--accent)' : 'var(--border)',
            background: enabled ? 'var(--accent-soft)' : 'var(--surface-muted)',
            color: enabled ? 'var(--accent)' : 'var(--text)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
            flexShrink: 0, whiteSpace: 'nowrap',
          }}
        >
          {enabled ? 'Turn off' : 'Turn on'}
        </button>
      )}

      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        style={{
          width: 20, height: 20, borderRadius: '50%', border: 'none', background: 'transparent',
          color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}
      >
        <X size={12} />
      </button>
    </div>
  )
}
