'use client'

import { ArrowLeft } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useStudioSession } from '@/lib/useStudioSession'
import { ChatPane } from './ChatPane'
import { PreviewPane } from './PreviewPane'

const MIN_CHAT_WIDTH = 300
const MAX_CHAT_WIDTH = 640
const DEFAULT_CHAT_WIDTH = 380

// Draggable divider between the chat and preview panes.
function ResizeHandle({ isResizing, onPointerDown }: { isResizing: boolean; onPointerDown: (e: React.PointerEvent) => void }) {
  const [hovered, setHovered] = useState(false)
  const active = isResizing || hovered

  return (
    <div
      onPointerDown={onPointerDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 5,
        flexShrink: 0,
        cursor: 'col-resize',
        position: 'relative',
        background: 'transparent',
      }}
      title="Drag to resize"
    >
      <div
        style={{
          position: 'absolute',
          left: 2,
          top: 0,
          bottom: 0,
          width: active ? 2 : 1,
          background: active ? 'var(--accent)' : 'var(--divider)',
          transition: isResizing ? 'none' : 'background 0.12s, width 0.12s',
        }}
      />
    </div>
  )
}

interface StudioSessionProps {
  initialPrompt: string
  onBackToLanding: () => void
}

export function StudioSession({ initialPrompt, onBackToLanding }: StudioSessionProps) {
  const session = useStudioSession(initialPrompt)
  const [chatWidth, setChatWidth] = useState(DEFAULT_CHAT_WIDTH)
  const [isResizing, setIsResizing] = useState(false)
  const dragState = useRef<{ startX: number; startWidth: number } | null>(null)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    dragState.current = { startX: e.clientX, startWidth: chatWidth }
    setIsResizing(true)
  }, [chatWidth])

  useEffect(() => {
    if (!isResizing) return

    const handlePointerMove = (e: PointerEvent) => {
      if (!dragState.current) return
      const delta = e.clientX - dragState.current.startX
      const next = Math.min(MAX_CHAT_WIDTH, Math.max(MIN_CHAT_WIDTH, dragState.current.startWidth + delta))
      setChatWidth(next)
    }
    const handlePointerUp = () => {
      dragState.current = null
      setIsResizing(false)
    }

    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerUp)
    const prevCursor = document.body.style.cursor
    const prevUserSelect = document.body.style.userSelect
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    return () => {
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', handlePointerUp)
      document.body.style.cursor = prevCursor
      document.body.style.userSelect = prevUserSelect
    }
  }, [isResizing])

  return (
    <div style={{ height: '100vh', overflow: 'hidden', background: 'var(--bg-canvas)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* Session bar */}
        <div
          style={{
            height: 'var(--topbar-h)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 14px',
            borderBottom: '1px solid var(--divider)',
            background: 'var(--surface-panel, var(--surface))',
          }}
        >
          <button
            onClick={onBackToLanding}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              border: 'none', background: 'transparent', cursor: 'pointer',
              fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-body)',
              padding: '5px 8px', borderRadius: 'var(--r-sm)',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--surface-muted)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
          >
            <ArrowLeft size={14} />
            New deck
          </button>
          <span style={{ fontSize: 12, color: 'var(--text-disabled)' }}>·</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
            Studio
          </span>
        </div>

        {/* Two panes + resize handle */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <ChatPane
            width={chatWidth}
            items={session.items}
            isWorking={session.isWorking}
            onAnswerClarify={session.answerClarify}
            onSendFollowUp={session.sendFollowUp}
          />
          <ResizeHandle isResizing={isResizing} onPointerDown={handlePointerDown} />
          <PreviewPane
            previewState={session.previewState}
            revealedSlides={session.revealedSlides}
            isWorking={session.isWorking}
          />
        </div>
      </div>
    </div>
  )
}
