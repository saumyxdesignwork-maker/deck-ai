'use client'

import { useEffect, useRef } from 'react'
import { ChatItem } from '@/lib/studioScript'
import { ChatItemView } from './ChatItem'
import { Composer } from './Composer'

interface ChatPaneProps {
  items: ChatItem[]
  isWorking: boolean
  onAnswerClarify: (answer: string) => void
  onSendFollowUp: (text: string) => void
  width: number
}

export function ChatPane({ items, isWorking, onAnswerClarify, onSendFollowUp, width }: ChatPaneProps) {
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
          />
        ))}
        {isWorking && (
          <div style={{ display: 'flex', gap: 4 }}>
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
          onSubmit={onSendFollowUp}
          placeholder="Enter your slides request here"
          variant="session"
        />
      </div>
    </div>
  )
}
