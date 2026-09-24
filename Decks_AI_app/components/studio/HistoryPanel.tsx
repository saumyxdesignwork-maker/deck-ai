'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import type { DeckHistoryEntry } from '@/lib/useDeckEditor'

interface HistoryPanelProps {
  history: DeckHistoryEntry[]
  onRestore: (id: string) => void
  onClose: () => void
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'numeric', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

/**
 * Every named checkpoint of the deck since it was first generated — one
 * entry per structural mutation (insert/delete/layout/rewrite/agent edit),
 * newest first, with the current state pinned at the top. Clicking an older
 * entry restores it as a new checkpoint (never rewrites history), same as
 * a real undo but reachable from further back than the linear undo stack.
 */
export function HistoryPanel({ history, onRestore, onClose }: HistoryPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  // Newest first; the last entry logged is the current state.
  const ordered = [...history].reverse()

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="History"
      style={{
        position: 'absolute', top: 44, right: 0, zIndex: 25,
        width: 320, maxHeight: 420,
        display: 'flex', flexDirection: 'column',
        background: 'var(--surface-solid)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--sh-3)',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid var(--divider)' }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-body)' }}>History</span>
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label="Close history"
          style={{
            width: 24, height: 24, borderRadius: '50%', border: 'none', background: 'transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
          }}
        >
          <X size={14} />
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {ordered.length === 0 ? (
          <p style={{ padding: '16px 12px', fontSize: 12.5, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', textAlign: 'center' }}>
            No changes yet — edits you make will show up here.
          </p>
        ) : (
          ordered.map((entry, i) => {
            const isCurrent = i === 0
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => { if (!isCurrent) onRestore(entry.id) }}
                disabled={isCurrent}
                style={{
                  display: 'flex', flexDirection: 'column', gap: 4,
                  padding: '10px 12px',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--border)',
                  background: isCurrent ? 'var(--accent-soft)' : 'var(--surface-muted)',
                  textAlign: 'left', width: '100%',
                  cursor: isCurrent ? 'default' : 'pointer',
                  fontFamily: 'var(--font-body)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{entry.label}</span>
                  {isCurrent && (
                    <span style={{
                      fontSize: 10.5, fontWeight: 700, color: 'var(--accent)', background: 'var(--surface)',
                      border: '1px solid var(--accent)', borderRadius: 'var(--r-pill)', padding: '1px 7px',
                    }}>
                      Current
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{formatTimestamp(entry.timestamp)}</span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
