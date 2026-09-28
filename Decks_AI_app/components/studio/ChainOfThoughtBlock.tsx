'use client'

import { useState } from 'react'
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
// Collapsed by default (intermediate steps are noise most people never
// need); a subtly pulsing icon is the only "processing" signal until
// someone clicks to expand and see the actual tool/checklist/reasoning
// steps underneath.
export function ChainOfThoughtBlock({ label, steps }: ChainOfThoughtBlockProps) {
  // A checklist with unchecked tasks (the /edit Editor stage) is in-flight
  // work too.
  const isActive = steps.length === 0 || steps.some(
    s => ((s.type === 'tool' || s.type === 'verify') && s.status === 'running')
      || (s.type === 'checklist' && s.tasks.some(t => !t.done))
  )
  const [open, setOpen] = useState(false)

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
            // The one "processing" signal visible by default — a slow,
            // subtle breathing opacity, not a spin (reserved for individual
            // running tool chips once expanded).
            animation: isActive ? 'studio-blink 1.6s ease-in-out infinite' : 'none',
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
