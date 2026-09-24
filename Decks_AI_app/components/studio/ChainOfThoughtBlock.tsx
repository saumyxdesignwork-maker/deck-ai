'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Sparkles } from 'lucide-react'
import { ChatItem } from '@/lib/studioScript'
import { ToolChip } from './ToolChip'
import { TaskChecklist } from './TaskChecklist'
import { ReasoningText } from './ReasoningText'

interface ChainOfThoughtBlockProps {
  label: string
  steps: ChatItem[]
}

// A collapsible "chain of thought" container — used both for a single
// reasoning moment and for grouping a run of tool calls / checklists
// (e.g. several "agents" writing individual slides) under one trigger,
// matching the Reasoning/ReasoningTrigger/ReasoningContent pattern.
export function ChainOfThoughtBlock({ label, steps }: ChainOfThoughtBlockProps) {
  // A checklist with unchecked tasks (the /edit Editor stage) is in-flight
  // work too — without this the block auto-collapsed mid-run, right after
  // the planning tool finished and before the review step started.
  const isActive = steps.length === 0 || steps.some(
    s => ((s.type === 'tool' || s.type === 'verify') && s.status === 'running')
      || (s.type === 'checklist' && s.tasks.some(t => !t.done))
  )
  const hasReasoning = steps.some(s => s.type === 'reasoning')
  const [open, setOpen] = useState(true)
  const autoCollapsedRef = useRef(false)

  useEffect(() => {
    if (!isActive && !autoCollapsedRef.current) {
      autoCollapsedRef.current = true
      // Give reasoning text a moment to finish streaming before folding away.
      const t = setTimeout(() => setOpen(false), hasReasoning ? 1400 : 700)
      return () => clearTimeout(t)
    }
  }, [isActive, hasReasoning])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          border: 'none', background: 'transparent', cursor: 'pointer',
          padding: 0, fontSize: 12, fontWeight: 500,
          color: isActive ? 'var(--accent)' : 'var(--text-muted)',
          fontFamily: 'var(--font-body)', alignSelf: 'flex-start',
        }}
      >
        <Sparkles
          size={13}
          style={{
            flexShrink: 0,
            color: isActive ? 'var(--accent)' : 'var(--text-muted)',
          }}
        />
        {isActive ? `${label}…` : label}
        <ChevronDown size={11} style={{ color: 'var(--text-disabled)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {open && (
        <div
          style={{
            marginLeft: 6,
            paddingLeft: 12,
            borderLeft: '2px solid var(--border)',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}
        >
          {steps.map(step => {
            switch (step.type) {
              case 'tool':
                return <ToolChip key={step.id} label={step.label} detail={step.detail} status={step.status} variant="tool" />
              case 'verify':
                return <ToolChip key={step.id} label={step.label} detail={step.detail} status={step.status} variant="verify" />
              case 'checklist':
                return <TaskChecklist key={step.id} title={step.title} tasks={step.tasks} />
              case 'reasoning':
                return <ReasoningText key={step.id} text={step.text} />
              default:
                return null
            }
          })}
        </div>
      )}
    </div>
  )
}
