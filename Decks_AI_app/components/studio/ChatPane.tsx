'use client'

import { useEffect, useRef } from 'react'
import { ChatItem } from '@/lib/studioScript'
import { ChatItemView } from './ChatItem'
import { Composer } from './Composer'
import type { ConnectStep } from './DataConnectPanel'

interface ChatPaneProps {
  items: ChatItem[]
  isWorking: boolean
  onAnswerClarify: (answers: string[]) => void
  onSendFollowUp: (text: string) => void
  onOpenConnectors: (initialStep?: ConnectStep) => void
  width: number
  /** Controlled composer draft — shared with the Ask AI popup so a prompt
   * started in one hands off to the other instead of getting lost. */
  draft: string
  onDraftChange: (value: string) => void
}

function hasActiveProgress(items: ChatItem[]): boolean {
  const last = items[items.length - 1]
  if (!last || last.type !== 'group') return false
  return last.children.length === 0 || last.children.some(
    c => ((c.type === 'tool' || c.type === 'verify') && c.status === 'running') || (c.type === 'checklist' && c.tasks.some(t => !t.done)),
  )
}

export function ChatPane({ items, isWorking, onAnswerClarify, onSendFollowUp, onOpenConnectors, width, draft, onDraftChange }: ChatPaneProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [items])

  return (
    <div
      style={{
        width,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--surface-panel, var(--surface))',
      }}
    >
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '20px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {items.map(item => (
          <ChatItemView
            key={item.id}
            item={item}
            onAnswerClarify={onAnswerClarify}
            onOpenConnectors={onOpenConnectors}
          />
        ))}
        {/* Generic "working" dots only when nothing more specific is
            already showing progress — never two competing indicators. */}
        {isWorking && !hasActiveProgress(items) && (
          <div role="status" aria-label="Working" style={{ display: 'flex', gap: 4 }}>
            {[0, 1, 2].map(i => (
              <span
                key={i}
                style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: 'var(--accent)',
                  animation: `studio-blink 1.2s ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '12px 14px', borderTop: '1px solid var(--divider)' }}>
        <Composer
          value={draft}
          onChange={onDraftChange}
          onSubmit={onSendFollowUp}
          placeholder="Enter your slides request here"
          variant="session"
          onOpenConnectors={onOpenConnectors}
        />
      </div>
    </div>
  )
}
