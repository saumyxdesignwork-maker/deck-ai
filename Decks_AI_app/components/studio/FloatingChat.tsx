'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Sparkles, Send, X, Undo2, RotateCcw, Loader2, CheckCircle2, AlertCircle, Maximize2 } from 'lucide-react'
import { ChatItem } from '@/lib/studioScript'
import { DeckSection } from '@/lib/fixtures'
import { EditRun } from '@/lib/editStages'
import { DOUBLE_META_ALLOW_ATTR } from '@/lib/useDoubleMetaTap'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ChatItemView } from './ChatItem'

export type ChatSurfaceState = 'closed' | 'expanded' | 'compact'

/** Shared layoutId — the expanded popup and compact prompt are one surface morphing between two sizes. */
export const ASK_AI_LAYOUT_ID = 'ask-ai-surface'
/** Fallback focus target when the element focused before opening is gone. */
export const ASK_AI_TRIGGER_ATTR = 'data-ask-ai-trigger'

interface FloatingChatProps {
  state: ChatSurfaceState
  onExpand: () => void
  onClose: () => void
  /** Called on send; the parent switches to `compact` and starts the run. */
  onSubmit: (instruction: string, activeSectionId?: string) => void
  activeSection: DeckSection | null
  /** Chat items belonging to the current/latest edit run (user message onward). */
  runItems: ChatItem[]
  isEditing: boolean
  run: EditRun | null
  canUndo: boolean
  onUndo: () => void
  /** Return true to swallow an Escape (e.g. a status-chip detail card is closing). */
  shouldIgnoreEscape?: () => boolean
}

/**
 * Compact floating "talk to the deck" surface — no backdrop, so the canvas
 * stays visible and interactive behind it. Opened via ⌘⌘ or the toolbar's
 * "Ask AI" button. Renders the live agent run through the SAME chat-item
 * components the persistent chat uses (real events from POST /edit).
 *
 * Three states: closed → expanded (compose / run) → compact (while a
 * request runs). The draft lives here and survives closing/reopening; it is
 * only cleared when sent.
 */
export function FloatingChat({
  state, onExpand, onClose, onSubmit, activeSection, runItems, isEditing, run, canUndo, onUndo, shouldIgnoreEscape,
}: FloatingChatProps) {
  const [instruction, setInstruction] = useState('')
  const [viewMode, setViewMode] = useState<'compose' | 'run'>('compose')
  const [lastInstruction, setLastInstruction] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const compactRef = useRef<HTMLButtonElement>(null)
  const railRef = useRef<HTMLDivElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)
  const scopeSectionRef = useRef<DeckSection | null>(null)
  const prevStateRef = useRef<ChatSurfaceState>('closed')
  const reduceMotion = useReducedMotion()

  // Focus choreography per transition. Runs after commit so the target exists.
  useEffect(() => {
    const prev = prevStateRef.current
    prevStateRef.current = state
    if (prev === state) return

    if (state === 'expanded') {
      if (prev === 'closed') {
        previouslyFocusedRef.current = document.activeElement as HTMLElement | null
        // Fresh open: show the run if one is still going, otherwise compose.
        setViewMode(isEditing ? 'run' : 'compose')
      } else {
        setViewMode('run')
      }
      inputRef.current?.focus()
      return
    }

    if (state === 'compact') {
      compactRef.current?.focus()
      return
    }

    // closed — only reclaim focus if it was inside the chat. The exiting
    // surface is still mounted during its fade-out (AnimatePresence), so
    // check containment rather than "focus fell back to body". If the user
    // clicked into the canvas to dismiss, leave focus there.
    const active = document.activeElement
    const focusWasInChat = !active || active === document.body || !!railRef.current?.contains(active)
    if (!focusWasInChat) return
    const prevEl = previouslyFocusedRef.current
    const target =
      prevEl && prevEl.isConnected && prevEl !== document.body
        ? prevEl
        : document.querySelector<HTMLElement>(`[${ASK_AI_TRIGGER_ATTR}]`)
    target?.focus()
    // isEditing is read only as a snapshot at open time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  useEffect(() => {
    if (state === 'closed') return
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.isComposing || e.keyCode === 229) return
      if (shouldIgnoreEscape?.()) return
      e.preventDefault()
      onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [state, onClose, shouldIgnoreEscape])

  const hasSummary = runItems.some(i => i.type === 'summary')
  const hasError = !isEditing && (run?.phase === 'failed' || (runItems.some(i => i.type === 'agent') && !hasSummary))

  const handleSubmit = () => {
    const text = instruction.trim()
    if (!text || isEditing) return
    setLastInstruction(text)
    scopeSectionRef.current = activeSection
    setInstruction('')
    setViewMode('run')
    onSubmit(text, activeSection?.id)
  }

  const handleRetry = () => {
    if (!lastInstruction || isEditing) return
    onSubmit(lastInstruction, scopeSectionRef.current?.id)
  }

  const noop = () => {}
  const transition = reduceMotion ? { duration: 0 } : { type: 'spring' as const, stiffness: 420, damping: 38, mass: 0.9 }
  const fade = reduceMotion ? { duration: 0 } : { duration: 0.14 }
  const canSend = !!instruction.trim() && !isEditing
  const isExpanded = state === 'expanded'

  return (
    // Full-width, click-through positioning rail: centering lives here (flex)
    // rather than as a CSS transform on the surface, so Motion's layout
    // transforms never fight a translateX(-50%).
    <div
      ref={railRef}
      style={{
        position: 'absolute', left: 0, right: 0, bottom: 20, zIndex: 30,
        display: 'flex', justifyContent: 'center', pointerEvents: 'none', padding: '0 16px',
      }}
    >
      <AnimatePresence initial={false}>
        {state !== 'closed' && (
          // ONE persistent surface for both sizes: `layout` + a shared
          // layoutId (inside the parent LayoutGroup) animate its box between
          // the expanded popup and the compact pill, so the prompt visibly
          // *becomes* the pill instead of one surface fading out while another
          // fades in. Only opening/closing uses enter/exit.
          <motion.div
            key="ask-ai-surface"
            layout
            layoutId={ASK_AI_LAYOUT_ID}
            role={isExpanded ? 'dialog' : 'group'}
            aria-modal={isExpanded ? 'false' : undefined}
            aria-labelledby={isExpanded ? 'ask-ai-title' : undefined}
            aria-label={isExpanded ? undefined : 'Ask AI (running in background)'}
            data-motion={reduceMotion ? 'reduced' : 'full'}
            data-state={state}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8, transition: fade }}
            transition={transition}
            style={isExpanded ? expandedSurfaceStyle : compactSurfaceStyle}
          >
            {isExpanded ? (
              <motion.div key="expanded-content" layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={fade} style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: viewMode === 'run' ? '1px solid var(--divider)' : 'none' }}>
                  <Sparkles size={13} aria-hidden style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  <span id="ask-ai-title" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-body)', flex: 1 }}>Ask AI</span>
                  <span
                    title={activeSection ? `Editing: ${activeSection.title}` : 'Whole deck'}
                    style={{
                      fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)',
                      padding: '2px 8px', borderRadius: 'var(--r-pill)', background: 'var(--surface-muted)',
                      maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0,
                    }}
                  >
                    {activeSection ? activeSection.title : 'Whole deck'}
                  </span>
                  <Button variant="ghost" size="icon-xs" onClick={onClose} aria-label="Close Ask AI" style={{ color: 'var(--text-muted)', borderRadius: '50%' }}>
                    <X size={13} />
                  </Button>
                </div>

                {viewMode === 'run' && (
                  <div style={{ flex: 1, overflow: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {runItems.map(item => (
                      <ChatItemView key={item.id} item={item} onAnswerClarify={noop} onOpenConnectors={noop} />
                    ))}
                    {!runItems.some(i => i.type === 'group') && isEditing && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                        <Loader2 size={13} className="animate-spin" aria-hidden /> Starting…
                      </div>
                    )}
                    {hasError && (
                      <button onClick={handleRetry} style={retryBtnStyle}>
                        <RotateCcw size={12} aria-hidden /> Retry
                      </button>
                    )}
                  </div>
                )}

                {/* Composer */}
                <div style={{ padding: '10px 12px', borderTop: viewMode === 'compose' ? 'none' : '1px solid var(--divider)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {viewMode === 'run' && !isEditing && (canUndo || hasSummary) && (
                    <button onClick={onUndo} disabled={!canUndo} style={{ ...retryBtnStyle, alignSelf: 'flex-start', opacity: canUndo ? 1 : 0.5, cursor: canUndo ? 'pointer' : 'not-allowed' }}>
                      <Undo2 size={12} aria-hidden /> Undo this edit
                    </button>
                  )}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                    <Textarea
                      ref={inputRef}
                      {...{ [DOUBLE_META_ALLOW_ATTR]: '' }}
                      aria-label="Describe a change to the deck"
                      value={instruction}
                      onChange={e => setInstruction(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                          e.preventDefault()
                          handleSubmit()
                        }
                      }}
                      placeholder={isEditing ? 'Draft your next change…' : 'Ask AI to change this deck…'}
                      rows={1}
                      className="min-h-9 max-h-[100px] resize-none md:text-[13px]"
                      style={{
                        flex: 1, borderColor: 'var(--border)', borderRadius: 'var(--r-md)',
                        padding: '8px 10px', background: 'var(--surface-muted)', color: 'var(--text)',
                        fontSize: 13, fontFamily: 'var(--font-body)',
                      }}
                    />
                    <Button
                      size="icon"
                      onClick={handleSubmit}
                      disabled={!canSend}
                      aria-label={isEditing ? 'Send (available when the current edit finishes)' : 'Send'}
                      style={{
                        borderRadius: '50%',
                        background: canSend ? 'var(--primary)' : 'var(--surface-muted)',
                        color: canSend ? 'var(--primary-fg)' : 'var(--text-disabled)',
                      }}
                    >
                      <Send size={14} />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <>
                <motion.button
                  key="compact-content"
                  layout="position"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={fade}
                  ref={compactRef}
                  type="button"
                  onClick={onExpand}
                  aria-label={`Reopen Ask AI — ${compactStatus(run, isEditing)}${instruction.trim() ? ', draft saved' : ''}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 12px', border: 'none', borderRadius: 'var(--r-pill)',
                    background: 'transparent', cursor: 'pointer',
                    fontSize: 12.5, color: 'var(--text)', fontFamily: 'var(--font-body)',
                    whiteSpace: 'nowrap', minWidth: 0,
                  }}
                >
                  <CompactIcon run={run} isEditing={isEditing} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{compactStatus(run, isEditing)}</span>
                  {instruction.trim() && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>· Draft saved</span>
                  )}
                  <Maximize2 size={12} aria-hidden style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </motion.button>
                <Button variant="ghost" size="icon-xs" onClick={onClose} aria-label="Close Ask AI" style={{ color: 'var(--text-muted)', borderRadius: '50%' }}>
                  <X size={12} />
                </Button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function compactStatus(run: EditRun | null, isEditing: boolean): string {
  if (!run) return isEditing ? 'Working…' : 'Ask AI'
  switch (run.phase) {
    case 'done': return 'Edit complete'
    case 'no-op': return 'No changes needed'
    case 'failed': return 'Edit failed'
    default: {
      const stage = run.stages[run.currentStep - 1]
      return `${stage.label} · step ${run.currentStep} of 3`
    }
  }
}

function CompactIcon({ run, isEditing }: { run: EditRun | null; isEditing: boolean }) {
  if (run?.phase === 'failed') return <AlertCircle size={13} aria-hidden style={{ color: 'var(--danger, #E8515A)', flexShrink: 0 }} />
  if (isEditing || run?.phase === 'running') return <Loader2 size={13} aria-hidden className="studio-spin" style={{ color: 'var(--accent)', flexShrink: 0 }} />
  return <CheckCircle2 size={13} aria-hidden style={{ color: 'var(--success)', flexShrink: 0 }} />
}

const expandedSurfaceStyle: React.CSSProperties = {
  pointerEvents: 'auto',
  width: 420,
  maxWidth: '100%',
  maxHeight: 'min(60vh, 560px)',
  display: 'flex',
  flexDirection: 'column',
  // Solid (not the translucent/glass --surface some visual languages use) —
  // this popup floats directly over live canvas content, so a glassy
  // background lets that text bleed through and turns illegible fast.
  background: 'var(--surface-solid)',
  border: '1px solid var(--border)',
  // Numeric radius so Motion can correct it during the layout (scale) morph.
  borderRadius: 20,
  boxShadow: 'var(--sh-3)',
  overflow: 'hidden',
}

const compactSurfaceStyle: React.CSSProperties = {
  pointerEvents: 'auto',
  display: 'flex', alignItems: 'center', gap: 2,
  padding: 4,
  background: 'var(--surface-solid)',
  border: '1px solid var(--border)',
  borderRadius: 999,
  boxShadow: 'var(--sh-2)',
  maxWidth: '100%',
  overflow: 'hidden',
}

const retryBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 5,
  padding: '5px 10px', borderRadius: 'var(--r-pill)',
  border: '1px solid var(--border)', background: 'var(--surface-muted)',
  color: 'var(--text)', fontSize: 12, fontWeight: 500,
  cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
  alignSelf: 'flex-start',
}
