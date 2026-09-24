'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { CheckCircle2, CircleAlert, CircleDashed, CircleMinus, Loader2, X } from 'lucide-react'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Badge } from '@/components/ui/badge'
import { describeTransition, EditRun, EditStage, EditStageStatus, STATUS_TEXT } from '@/lib/editStages'
import { motionPresets } from '@/lib/motion'

interface EditStageChipsProps {
  run: EditRun
  onDismiss: () => void
  /** Reports detail-card open state so Escape closes the card before the chat. */
  onDetailOpenChange?: (open: boolean, closedByEscape: boolean) => void
}

/**
 * Three quiet status chips (Plan → Edit → Review) pinned to the lower-left of
 * the canvas. A compact projection of the same /edit event group the
 * persistent chat renders via ChainOfThoughtBlock — not a second data source.
 * Stages are sequential in the backend, and the numbering says so.
 */
export function EditStageChips({ run, onDismiss, onDetailOpenChange }: EditStageChipsProps) {
  const [announcement, setAnnouncement] = useState('')
  const prevRunRef = useRef<EditRun | null>(null)
  const m = motionPresets(useReducedMotion())

  // Announce only meaningful stage/phase transitions — never per checklist
  // tick or animation frame. Keyed on the statuses, not the object identity.
  const signature = `${run.phase}|${run.stages.map(s => s.status).join(',')}`
  useEffect(() => {
    const message = describeTransition(prevRunRef.current, run)
    prevRunRef.current = run
    if (message) setAnnouncement(message)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature])

  return (
    // Brief arrival (fade + small rise) — the canvas behind never moves.
    <motion.div
      role="group"
      aria-label="Edit progress"
      data-testid="edit-stage-chips"
      initial={m.arrive.initial}
      animate={m.arrive.animate}
      exit={{ opacity: 0, transition: m.exit }}
      transition={m.overlay}
      style={{
        position: 'absolute', left: 16, bottom: 16, zIndex: 20,
        display: 'flex', alignItems: 'center', gap: 6,
      }}
    >
      {run.stages.map((stage, i) => (
        <StageChip key={stage.id} stage={stage} index={i + 1} onDetailOpenChange={onDetailOpenChange} />
      ))}
      {run.phase !== 'running' && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss edit progress"
          style={{
            width: 22, height: 22, borderRadius: '50%', border: 'none',
            background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <X size={12} aria-hidden />
        </button>
      )}
      <div role="status" aria-live="polite" aria-atomic="true" style={srOnly}>
        {announcement}
      </div>
    </motion.div>
  )
}

function StageChip({
  stage, index, onDetailOpenChange,
}: { stage: EditStage; index: number; onDetailOpenChange?: EditStageChipsProps['onDetailOpenChange'] }) {
  const [open, setOpen] = useState(false)
  // Hover and keyboard focus are handled by the HoverCard itself. Touch has
  // no hover, so a tap toggles the card instead.
  const lastPointerTypeRef = useRef<string>('mouse')
  const m = motionPresets(useReducedMotion())

  const setOpenAndReport = (next: boolean, byEscape = false) => {
    setOpen(next)
    onDetailOpenChange?.(next, byEscape)
  }

  const isActive = stage.status === 'running' || stage.status === 'failed'

  return (
    <HoverCard
      open={open}
      onOpenChange={(next, details) => setOpenAndReport(next, details.reason === 'escape-key')}
    >
      <HoverCardTrigger
        delay={120}
        closeDelay={80}
        aria-label={`Step ${index} of 3, ${stage.label}: ${STATUS_TEXT[stage.status]}. ${stage.step}`}
        data-status={stage.status}
        onPointerDown={e => { lastPointerTypeRef.current = e.pointerType }}
        onClick={() => {
          if (lastPointerTypeRef.current === 'touch' || lastPointerTypeRef.current === 'pen') setOpenAndReport(!open)
        }}
        render={
          <Badge
            render={<button type="button" />}
            variant="outline"
            className="h-6 cursor-default gap-1.5 px-2 focus-visible:ring-2"
            style={{
              background: 'var(--surface-solid)',
              borderColor: isActive ? 'var(--text-muted)' : 'var(--border)',
              color: stage.status === 'waiting' ? 'var(--text-muted)' : 'var(--text)',
              boxShadow: 'var(--sh-1)',
              fontFamily: 'var(--font-body)',
              fontSize: 11.5,
            }}
          />
        }
      >
        <StatusIcon status={stage.status} />
        <span style={{ fontWeight: 600 }}>{stage.label}</span>
        <span aria-hidden style={{ color: 'var(--text-muted)', display: 'inline-flex', overflow: 'hidden' }}>
          {/* Status text crossfades on update. */}
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={stage.short}
              initial={{ opacity: 0, y: m.reduce ? 0 : 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: m.reduce ? 0 : -3 }}
              transition={m.control}
            >
              {stage.short}
            </motion.span>
          </AnimatePresence>
        </span>
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        align="start"
        sideOffset={8}
        alignOffset={0}
        className="w-64 motion-reduce:animate-none"
        style={{ background: 'var(--surface-solid)', color: 'var(--text)', fontFamily: 'var(--font-body)', display: 'flex', flexDirection: 'column', gap: 6 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
          <StatusIcon status={stage.status} />
          Step {index} of 3 · {stage.label}
          <span style={{ marginLeft: 'auto', fontWeight: 500, color: 'var(--text-muted)' }}>{STATUS_TEXT[stage.status]}</span>
        </div>
        <DetailRow label="Current step" value={stage.step} />
        <DetailRow label="Latest change" value={stage.latestChange ?? '—'} />
      </HoverCardContent>
    </HoverCard>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-disabled)' }}>{label}</span>
      <span style={{ fontSize: 12.5, lineHeight: 1.45, color: 'var(--text)' }}>{value}</span>
    </div>
  )
}

function StatusIcon({ status }: { status: EditStageStatus }) {
  const common = { size: 12, 'aria-hidden': true, style: { flexShrink: 0 } } as const
  switch (status) {
    case 'running':
      return <Loader2 {...common} className="studio-spin" style={{ ...common.style, color: 'var(--accent)' }} />
    case 'done':
      return <CheckCircle2 {...common} style={{ ...common.style, color: 'var(--success)' }} />
    case 'skipped':
      return <CircleMinus {...common} style={{ ...common.style, color: 'var(--text-muted)' }} />
    case 'failed':
      return <CircleAlert {...common} style={{ ...common.style, color: 'var(--danger, #E8515A)' }} />
    default:
      return <CircleDashed {...common} style={{ ...common.style, color: 'var(--text-disabled)' }} />
  }
}

const srOnly: React.CSSProperties = {
  position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
  overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0,
}
