'use client'

import { CheckCircle2, Circle, ListChecks } from 'lucide-react'
import { ChecklistTask } from '@/lib/studioScript'

interface TaskChecklistProps {
  title: string
  tasks: ChecklistTask[]
}

export function TaskChecklist({ title, tasks }: TaskChecklistProps) {
  const doneCount = tasks.filter(t => t.done).length

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        background: 'var(--surface-muted)',
        overflow: 'hidden',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ListChecks size={13} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-body)' }}>{title}</span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{doneCount}/{tasks.length}</span>
      </div>
      <div style={{ padding: '6px 12px 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {tasks.map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            {t.done
              ? <CheckCircle2 size={13} style={{ color: 'var(--success)', flexShrink: 0 }} />
              : <Circle size={13} style={{ color: 'var(--text-disabled)', flexShrink: 0 }} />}
            <span style={{
              fontSize: 12,
              color: t.done ? 'var(--text-muted)' : 'var(--text)',
              textDecoration: t.done ? 'line-through' : 'none',
              fontFamily: 'var(--font-body)',
            }}>
              {t.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
