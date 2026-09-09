'use client'

import { Copy, ThumbsUp, ThumbsDown, MoreHorizontal } from 'lucide-react'
import { ChatItem as ChatItemType } from '@/lib/studioScript'
import { ToolChip } from './ToolChip'
import { ThinkingDots } from './ThinkingDots'
import { TaskChecklist } from './TaskChecklist'
import { ClarifyCard } from './ClarifyCard'
import { OutlineCard } from './OutlineCard'

interface ChatItemProps {
  item: ChatItemType
  onAnswerClarify: (answer: string) => void
  onApproveOutline: () => void
  onRegenerateOutline: () => void
}

export function ChatItemView({ item, onAnswerClarify, onApproveOutline, onRegenerateOutline }: ChatItemProps) {
  switch (item.type) {
    case 'user':
      return (
        <div
          style={{
            alignSelf: 'flex-start',
            background: 'var(--surface-muted)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            padding: '10px 14px',
            fontSize: 13,
            color: 'var(--text)',
            lineHeight: 1.55,
            fontFamily: 'var(--font-body)',
          }}
        >
          {item.text}
        </div>
      )

    case 'agent':
      return (
        <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, fontFamily: 'var(--font-body)', margin: 0 }}>
          {item.text}
        </p>
      )

    case 'tool':
      return <ToolChip label={item.label} detail={item.detail} status={item.status} variant="tool" />

    case 'verify':
      return <ToolChip label={item.label} detail={item.detail} status={item.status} variant="verify" />

    case 'thinking':
      return <ThinkingDots />

    case 'checklist':
      return <TaskChecklist title={item.title} tasks={item.tasks} />

    case 'clarify':
      return (
        <ClarifyCard
          question={item.question}
          options={item.options}
          answered={item.answered}
          onSubmit={onAnswerClarify}
        />
      )

    case 'outline':
      return (
        <OutlineCard
          sections={item.sections}
          approved={item.approved}
          onApprove={onApproveOutline}
          onRegenerate={onRegenerateOutline}
        />
      )

    case 'summary':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, fontFamily: 'var(--font-body)', margin: 0 }}>
            {item.text}
          </p>
          <div style={{ display: 'flex', gap: 4 }}>
            {[Copy, ThumbsUp, ThumbsDown, MoreHorizontal].map((Icon, i) => (
              <button
                key={i}
                style={{
                  width: 24, height: 24, borderRadius: 'var(--r-sm)',
                  border: 'none', background: 'transparent', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-muted)',
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--surface-muted)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
              >
                <Icon size={12} />
              </button>
            ))}
          </div>
        </div>
      )

    default:
      return null
  }
}
