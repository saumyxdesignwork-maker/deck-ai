'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, MessageSquare, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useStudioSession } from '@/lib/useStudioSession'
import { useResizableWidth } from '@/lib/useResizableWidth'
import { ResizeHandle } from '@/components/shared/ResizeHandle'
import { AspectRatio } from '@/lib/fixtures'
import { ChatPane } from './ChatPane'
import { PreviewPane } from './PreviewPane'
import { DataConnectPanel, ConnectStep } from './DataConnectPanel'

const MIN_CHAT_WIDTH = 300
const MAX_CHAT_WIDTH = 640
const DEFAULT_CHAT_WIDTH = 380
const CHAT_RAIL_WIDTH = 48

interface StudioSessionProps {
  initialPrompt: string
  aspectRatio: AspectRatio
  onBackToLanding: () => void
}

export function StudioSession({ initialPrompt, aspectRatio, onBackToLanding }: StudioSessionProps) {
  const session = useStudioSession(initialPrompt, aspectRatio)
  const { width: chatWidth, isResizing, handlePointerDown } =
    useResizableWidth(DEFAULT_CHAT_WIDTH, MIN_CHAT_WIDTH, MAX_CHAT_WIDTH)
  const [connectStep, setConnectStep] = useState<ConnectStep | null>(null)

  // Canvas-first: once slide generation begins, the persistent chat gives up
  // its full column and shrinks to a reopenable rail so the canvas can take
  // over. Auto-collapses exactly once (not on every render) — after that
  // it's fully under the user's control via the rail/collapse toggle.
  const [chatCollapsed, setChatCollapsed] = useState(false)
  const hasAutoCollapsedRef = useRef(false)
  useEffect(() => {
    if (session.previewState !== 'idle' && !hasAutoCollapsedRef.current) {
      hasAutoCollapsedRef.current = true
      setChatCollapsed(true)
    }
  }, [session.previewState])

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
          {session.previewState !== 'idle' && (
            <button
              onClick={() => setChatCollapsed(c => !c)}
              title={chatCollapsed ? 'Show chat' : 'Hide chat'}
              style={{
                marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5,
                border: 'none', background: 'transparent', cursor: 'pointer',
                fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-body)',
                padding: '5px 8px', borderRadius: 'var(--r-sm)',
              }}
            >
              {chatCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
            </button>
          )}
        </div>

        {/* Two panes + resize handle */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {chatCollapsed ? (
            <button
              onClick={() => setChatCollapsed(false)}
              title="Show chat"
              style={{
                width: CHAT_RAIL_WIDTH, flexShrink: 0, height: '100%',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 16,
                border: 'none', borderRight: '1px solid var(--divider)',
                background: 'var(--surface-panel, var(--surface))', cursor: 'pointer',
                color: 'var(--text-muted)',
              }}
            >
              <MessageSquare size={16} />
            </button>
          ) : (
            <>
              <ChatPane
                width={chatWidth}
                items={session.items}
                isWorking={session.isWorking}
                onAnswerClarify={session.answerClarify}
                onSendFollowUp={session.sendFollowUp}
                onOpenConnectors={(initialStep = 'providers') => setConnectStep(initialStep)}
              />
              <ResizeHandle isResizing={isResizing} onPointerDown={handlePointerDown} />
            </>
          )}
          <PreviewPane
            previewState={session.previewState}
            revealedSlides={session.revealedSlides}
            deck={session.deck}
            isWorking={session.isWorking}
            outlinePending={session.outlinePending}
            onApproveOutline={session.approveOutline}
            onRegenerateOutline={() => session.regenerateOutline()}
            verifyFlags={session.verifyFlags}
            isVerifying={session.isVerifying}
            onVerify={session.verifyContent}
            isRewriting={session.isRewriting}
            onRewriteBlock={session.rewriteBlock}
            canUndo={session.canUndo}
            canRedo={session.canRedo}
            onUndo={session.undo}
            onRedo={session.redo}
            onInsertBlock={session.insertBlock}
            onInsertSection={session.insertSection}
            onDeleteBlocks={session.deleteBlocks}
            onDuplicateBlocks={session.duplicateBlocks}
            onApplyRewrite={session.applyRewrite}
            onBeginBlockEdit={session.beginBlockEdit}
            onUpdateBlockContent={session.updateBlockContent}
            onCommitBlockEdit={session.commitBlockEdit}
            onSetSectionLayout={session.setSectionLayout}
            items={session.items}
            isEditing={session.isEditing}
            editGroupId={session.editGroupId}
            onRunEdit={session.runEdit}
          />
        </div>
      </div>

      {connectStep && (
        <DataConnectPanel
          sessionId={session.sessionId}
          initialStep={connectStep}
          onClose={() => setConnectStep(null)}
          onAttach={dataset => {
            session.attachDataset(dataset)
            setConnectStep(null)
          }}
        />
      )}
    </div>
  )
}
