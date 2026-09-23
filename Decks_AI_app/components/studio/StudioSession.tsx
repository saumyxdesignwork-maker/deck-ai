'use client'

import { ArrowLeft } from 'lucide-react'
import { useStudioSession } from '@/lib/useStudioSession'
import { useResizableWidth } from '@/lib/useResizableWidth'
import { ResizeHandle } from '@/components/shared/ResizeHandle'
import { AspectRatio } from '@/lib/fixtures'
import { ChatPane } from './ChatPane'
import { PreviewPane } from './PreviewPane'

const MIN_CHAT_WIDTH = 300
const MAX_CHAT_WIDTH = 640
const DEFAULT_CHAT_WIDTH = 380

interface StudioSessionProps {
  initialPrompt: string
  aspectRatio: AspectRatio
  onBackToLanding: () => void
}

export function StudioSession({ initialPrompt, aspectRatio, onBackToLanding }: StudioSessionProps) {
  const session = useStudioSession(initialPrompt, aspectRatio)
  const { width: chatWidth, isResizing, handlePointerDown } =
    useResizableWidth(DEFAULT_CHAT_WIDTH, MIN_CHAT_WIDTH, MAX_CHAT_WIDTH)

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
          />
        </div>
      </div>
    </div>
  )
}
