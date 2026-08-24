'use client'

import { ArrowLeft } from 'lucide-react'
import { useTheme } from '@/components/controls/ThemeProvider'
import { useStudioSession } from '@/lib/useStudioSession'
import { ChatPane } from './ChatPane'
import { PreviewPane } from './PreviewPane'

// macOS-style traffic-light cluster — warm muted colours for VL3 (mirrors TopBar/EditorTopBar)
function TrafficLights() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
      {['#E8A0A0', '#E8C889', '#A9CBA0'].map((color, i) => (
        <div key={i} style={{ width: 11, height: 11, borderRadius: '50%', background: color, opacity: 0.85 }} />
      ))}
    </div>
  )
}

interface StudioSessionProps {
  initialPrompt: string
  onBackToLanding: () => void
}

export function StudioSession({ initialPrompt, onBackToLanding }: StudioSessionProps) {
  const { vl } = useTheme()
  const isVL3 = vl === '3'
  const session = useStudioSession(initialPrompt)

  const sessionBody = (
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
        {isVL3 && <TrafficLights />}
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

      {/* Two panes */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <ChatPane
          items={session.items}
          isWorking={session.isWorking}
          onAnswerClarify={session.answerClarify}
          onSendFollowUp={session.sendFollowUp}
        />
        <PreviewPane
          previewState={session.previewState}
          revealedSlides={session.revealedSlides}
          isWorking={session.isWorking}
        />
      </div>
    </div>
  )

  if (isVL3) {
    return (
      <div style={{ padding: 'var(--window-inset)', height: '100vh', boxSizing: 'border-box', background: 'transparent' }}>
        <div
          data-glass
          style={{
            height: '100%',
            borderRadius: 'var(--r-window)',
            overflow: 'hidden',
            boxShadow: 'var(--sh-3)',
            border: '1px solid var(--border)',
            background: 'var(--surface-panel, var(--surface))',
          }}
        >
          {sessionBody}
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', overflow: 'hidden', background: 'var(--bg-canvas)' }}>
      {sessionBody}
    </div>
  )
}
