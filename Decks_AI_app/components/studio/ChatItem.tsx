'use client'

import { Copy, ThumbsUp, ThumbsDown, MoreHorizontal, ShieldCheck, TriangleAlert, Info } from 'lucide-react'
import { ChatItem as ChatItemType } from '@/lib/studioScript'
import { ToolChip } from './ToolChip'
import { TaskChecklist } from './TaskChecklist'
import { ClarifyCard } from './ClarifyCard'
import { OutlineCard } from './OutlineCard'
import { ReasoningText } from './ReasoningText'
import { ChainOfThoughtBlock } from './ChainOfThoughtBlock'
import { DataNudgeCard } from './DataNudgeCard'
import type { ConnectStep } from './DataConnectPanel'

interface ChatItemProps {
  item: ChatItemType
  onAnswerClarify: (answers: string[]) => void
  onOpenConnectors: (initialStep?: ConnectStep) => void
}

export function ChatItemView({ item, onAnswerClarify, onOpenConnectors }: ChatItemProps) {
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

    case 'reasoning':
      return <ReasoningText text={item.text} />

    case 'group':
      return <ChainOfThoughtBlock label={item.label} steps={item.children} />

    case 'checklist':
      return <TaskChecklist title={item.title} tasks={item.tasks} />

    case 'clarify':
      return (
        <ClarifyCard
          questions={item.questions}
          answered={item.answered}
          onSubmit={onAnswerClarify}
        />
      )

    case 'data-nudge':
      return <DataNudgeCard onOpenConnectors={onOpenConnectors} />

    case 'outline':
      return <OutlineCard sectionCount={item.sections.length} approved={item.approved} />

    case 'verify-report':
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: item.flags.length ? '1px solid var(--divider)' : 'none' }}>
            <ShieldCheck size={14} style={{ color: item.flags.length ? '#E8963C' : 'var(--accent)', flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
              {item.flags.length ? `${item.flags.length} content issue${item.flags.length > 1 ? 's' : ''} found` : 'No content issues found'}
            </span>
          </div>
          {item.flags.length > 0 && (
            <div style={{ padding: '6px 8px' }}>
              {item.flags.map((flag, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 8px' }}>
                  {flag.severity === 'warning'
                    ? <TriangleAlert size={13} style={{ color: '#E8963C', flexShrink: 0, marginTop: 2 }} />
                    : <Info size={13} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-body)' }}>{flag.sectionTitle}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>{flag.issue}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
