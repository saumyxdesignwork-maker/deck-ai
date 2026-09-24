'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Circle, ChevronLeft, ChevronRight, Paperclip } from 'lucide-react'
import { ClarifyQuestion } from '@/lib/studioScript'
import { motionPresets } from '@/lib/motion'

interface ClarifyCardProps {
  questions: ClarifyQuestion[]
  answered?: string[]
  onSubmit: (answers: string[]) => void
}

export function ClarifyCard({ questions, answered, onSubmit }: ClarifyCardProps) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<(string | null)[]>(() => questions.map(() => null))
  const [details, setDetails] = useState<string[]>(() => questions.map(() => ''))
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const topicRef = useRef<HTMLSpanElement>(null)
  const prevStepRef = useRef(step)
  const [announcement, setAnnouncement] = useState('')
  const m = motionPresets(useReducedMotion())

  useEffect(() => () => {
    if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current)
  }, [])

  // When the step changes, the option the user just clicked unmounts —
  // without this, keyboard focus would fall back to <body>. Move it to the
  // new question's heading and announce it (never on first render).
  useEffect(() => {
    if (prevStepRef.current === step) return
    prevStepRef.current = step
    topicRef.current?.focus()
    const q = questions[step]
    // eslint-disable-next-line react-hooks/set-state-in-effect -- announcing an already-happened step change
    if (q) setAnnouncement(`Question ${step + 1} of ${questions.length}: ${q.topic}`)
  }, [step, questions])

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
        {questions.map((q, i) => (
          <div key={q.topic}>
            <div><strong>Q:</strong> {q.topic}</div>
            <div><strong>A:</strong> {answered[i] ?? 'Skipped'}</div>
          </div>
        ))}
      </div>
    )
  }

  const total = questions.length
  const isLast = step === total - 1
  const question = questions[step]
  const selected = answers[step]
  const percent = Math.round(((step + 1) / total) * 100)

  // Picking an option both selects it AND advances — the manual "Next"
  // button was the only way forward before, but it sits below the option
  // list (and, with 4+ options, below the visible fold of the chat panel)
  // so it wasn't reliably reachable right after a click. A short delay lets
  // the selection highlight register before moving on; the "<" back arrow
  // still works if someone wants to reconsider. Free-text (the "Additional
  // details" field) intentionally does NOT auto-advance — see setDetail.
  const setSelected = (opt: string) => {
    const nextAnswers = answers.map((a, i) => (i === step ? opt : a))
    setAnswers(nextAnswers)
    setDetails(prev => prev.map((d, i) => (i === step ? '' : d)))
    if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current)
    advanceTimeoutRef.current = setTimeout(() => {
      if (isLast) finalize(nextAnswers)
      else setStep(s => Math.min(total - 1, s + 1))
    }, 280)
  }

  const setDetail = (val: string) => {
    setDetails(prev => prev.map((d, i) => (i === step ? val : d)))
    setAnswers(prev => prev.map((a, i) => (i === step ? null : a)))
  }

  const finalize = (finalAnswers: (string | null)[]) =>
    onSubmit(finalAnswers.map((a, i) => a ?? details[i].trim() ?? 'Skipped'))

  const currentAnswer = () => selected ?? details[step].trim()

  const skip = () => {
    const next = answers.map((a, i) => (i === step ? 'Skipped' : a))
    setAnswers(next)
    if (isLast) finalize(next)
    else setStep(step + 1)
  }

  const advance = () => {
    if (!currentAnswer()) return
    if (isLast) finalize(answers)
    else setStep(step + 1)
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid var(--divider)',
        }}
      >
        <span
          ref={topicRef}
          tabIndex={-1}
          id={`clarify-topic-${step}`}
          style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-body)', outline: 'none' }}
        >
          {question.topic}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>{percent}%</span>
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            aria-label="Previous question"
            style={navBtnStyle(step === 0)}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => setStep(s => Math.min(total - 1, s + 1))}
            disabled={isLast || !currentAnswer()}
            aria-label="Next question"
            style={navBtnStyle(isLast || !currentAnswer())}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div role="status" aria-live="polite" aria-atomic="true" style={srOnly}>{announcement}</div>

      <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={step}
        initial={m.arrive.initial}
        animate={m.arrive.animate}
        exit={{ opacity: 0, transition: m.exit }}
        transition={m.content}
        style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        <div role="group" aria-labelledby={`clarify-topic-${step}`} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {question.options.map(opt => {
            const isSelected = selected === opt
            return (
              <button
                key={opt}
                onClick={() => setSelected(opt)}
                aria-pressed={isSelected}
                className="dk-select dk-focus-ring"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '11px 14px',
                  borderRadius: 'var(--r-md)',
                  border: '1.5px solid',
                  borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                  background: isSelected ? 'var(--accent-soft)' : 'var(--surface-muted)',
                  color: isSelected ? 'var(--accent)' : 'var(--text)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'var(--font-body)',
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

        <div style={{ position: 'relative' }}>
          <input
            value={details[step]}
            onChange={e => setDetail(e.target.value)}
            aria-label="Additional details (optional)"
            placeholder="Additional details (optional)"
            style={{
              width: '100%',
              padding: '8px 32px 8px 12px',
              borderRadius: 'var(--r-sm)',
              border: '1px solid var(--border)',
              background: 'var(--surface-muted)',
              fontSize: 12.5,
              color: 'var(--text)',
              outline: 'none',
              fontFamily: 'var(--font-body)',
              boxSizing: 'border-box',
            }}
          />
          <Paperclip size={13} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={skip} style={skipBtnStyle}>
            Skip
          </button>
          <button
            onClick={advance}
            disabled={!currentAnswer()}
            style={{
              padding: '7px 16px', borderRadius: 'var(--r-pill)',
              border: 'none',
              background: currentAnswer() ? 'var(--primary)' : 'var(--surface-muted)',
              color: currentAnswer() ? 'var(--primary-fg)' : 'var(--text-disabled)',
              fontSize: 12.5, fontWeight: 600,
              cursor: currentAnswer() ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-body)',
            }}
          >
            {isLast ? 'Submit' : 'Next'}
          </button>
        </div>
      </motion.div>
      </AnimatePresence>
    </div>
  )
}

const srOnly: React.CSSProperties = {
  position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
  overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0,
}

function navBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    width: 22, height: 22, borderRadius: '50%',
    border: '1px solid var(--border)', background: 'var(--surface-muted)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: disabled ? 'var(--text-disabled)' : 'var(--text)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
  }
}

const skipBtnStyle: React.CSSProperties = {
  padding: '7px 14px', borderRadius: 'var(--r-pill)',
  border: '1px solid var(--border)', background: 'transparent',
  fontSize: 12.5, color: 'var(--text-muted)', cursor: 'pointer',
  fontFamily: 'var(--font-body)',
}
