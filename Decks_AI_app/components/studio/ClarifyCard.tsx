'use client'

import { useState } from 'react'
import { Circle } from 'lucide-react'

interface ClarifyCardProps {
  question: string
  options: string[]
  answered?: string
  onSubmit: (answer: string) => void
}

export function ClarifyCard({ question, options, answered, onSubmit }: ClarifyCardProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [details, setDetails] = useState('')

  // Already answered — render the compact Q/A echo bubble (matches reference)
  if (answered) {
    return (
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          padding: '10px 14px',
          fontSize: 12,
          color: 'var(--text)',
          fontFamily: 'var(--font-body)',
          lineHeight: 1.6,
        }}
      >
        <div><strong>Q:</strong> {question}</div>
        <div><strong>A:</strong> {answered}</div>
      </div>
    )
  }

  const submit = () => {
    const answer = selected ?? details.trim()
    if (!answer) return
    onSubmit(answer)
  }

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
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--divider)' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
          {question}
        </span>
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {options.map(opt => {
            const isSelected = selected === opt
            return (
              <button
                key={opt}
                onClick={() => setSelected(opt)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: 'var(--r-sm)',
                  border: '1.5px solid',
                  borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                  background: isSelected ? 'var(--accent-soft)' : 'var(--surface-muted)',
                  color: isSelected ? 'var(--accent)' : 'var(--text)',
                  fontSize: 12.5,
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'var(--font-body)',
                  transition: 'all 0.12s',
                }}
              >
                {opt}
                <span style={{ position: 'relative', width: 14, height: 14, flexShrink: 0 }}>
                  <Circle size={14} style={{ color: isSelected ? 'var(--accent)' : 'var(--border)' }} />
                  {isSelected && (
                    <Circle
                      size={6}
                      fill="var(--accent)"
                      stroke="none"
                      style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                    />
                  )}
                </span>
              </button>
            )
          })}
        </div>

        <input
          value={details}
          onChange={e => { setDetails(e.target.value); setSelected(null) }}
          placeholder="Additional details (optional)"
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--r-sm)',
            border: '1px solid var(--border)',
            background: 'var(--surface-muted)',
            fontSize: 12.5,
            color: 'var(--text)',
            outline: 'none',
            fontFamily: 'var(--font-body)',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={() => onSubmit('Skipped')}
            style={{
              padding: '7px 14px', borderRadius: 'var(--r-pill)',
              border: '1px solid var(--border)', background: 'transparent',
              fontSize: 12.5, color: 'var(--text-muted)', cursor: 'pointer',
              fontFamily: 'var(--font-body)',
            }}
          >
            Skip
          </button>
          <button
            onClick={submit}
            disabled={!selected && !details.trim()}
            style={{
              padding: '7px 16px', borderRadius: 'var(--r-pill)',
              border: 'none',
              background: (selected || details.trim()) ? 'var(--primary)' : 'var(--surface-muted)',
              color: (selected || details.trim()) ? 'var(--primary-fg)' : 'var(--text-disabled)',
              fontSize: 12.5, fontWeight: 600,
              cursor: (selected || details.trim()) ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-body)',
            }}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  )
}
