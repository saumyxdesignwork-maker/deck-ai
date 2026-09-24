'use client'

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { motionPresets } from '@/lib/motion'
import { MousePointer2, PenSquare, ShieldCheck, Loader2, Sparkles, X } from 'lucide-react'
import { isApplePlatform } from '@/lib/useDoubleMetaTap'
import { ASK_AI_TRIGGER_ATTR } from './FloatingChat'

export const ASK_AI_HINT_SEEN_KEY = 'deckai.askAiHintSeen'
const noopSubscribe = () => () => {}

const TOOLS = [
  { key: 'select', icon: MousePointer2, label: 'Select' },
  { key: 'edit',   icon: PenSquare,     label: 'Edit' },
] as const

export type CanvasMode = typeof TOOLS[number]['key']

interface PreviewToolbarProps {
  mode: CanvasMode
  onModeChange: (mode: CanvasMode) => void
  onVerify: () => void
  isVerifying: boolean
  flagCount: number | null
  onOpenAskAI: () => void
  /** True while the Ask AI surface is expanded or compact. */
  isChatOpen: boolean
  /** Hides this smaller one-liner while the full shortcut walkthrough is
   * showing — they teach the same ⌘⌘ gesture, and both at once is clutter. */
  suppressCoachmark?: boolean
}

export function PreviewToolbar({ mode, onModeChange, onVerify, isVerifying, flagCount, onOpenAskAI, isChatOpen, suppressCoachmark }: PreviewToolbarProps) {
  // ⌘⌘ only exists on Apple platforms (see useDoubleMetaTap) — don't
  // advertise a shortcut that can't work. Server snapshot is false.
  const showShortcut = useSyncExternalStore(noopSubscribe, isApplePlatform, () => false)
  const [hintSeen, setHintSeen] = useState(() => {
    try { return window.localStorage.getItem(ASK_AI_HINT_SEEN_KEY) === '1' } catch { return true }
  })
  const dismissHint = useCallback(() => {
    setHintSeen(true)
    try { window.localStorage.setItem(ASK_AI_HINT_SEEN_KEY, '1') } catch {}
  }, [])
  const showCoachmark = showShortcut && !hintSeen && !isChatOpen && !suppressCoachmark
  const m = motionPresets(useReducedMotion())

  // Using Ask AI at all (button or ⌘⌘) counts as having learned it. State
  // adjusted during render (React's documented pattern for deriving from a
  // prop change); only the storage write — an external system — is an effect.
  if (isChatOpen && !hintSeen) setHintSeen(true)
  useEffect(() => {
    if (!hintSeen) return
    try { window.localStorage.setItem(ASK_AI_HINT_SEEN_KEY, '1') } catch {}
  }, [hintSeen])

  useEffect(() => {
    if (!showCoachmark) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.isComposing) dismissHint()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showCoachmark, dismissHint])

  return (
    <div
      style={{
        position: 'absolute',
        top: 14,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: 4,
        borderRadius: 'var(--r-pill)',
        // Solid, not the translucent/glass --surface — this pill floats
        // directly over the canvas in VL2/VL3, and a glassy background lets
        // slide content bleed through behind it.
        background: 'var(--surface-solid)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--sh-2)',
        zIndex: 15,
      }}
    >
      {TOOLS.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          onClick={() => onModeChange(key)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px',
            borderRadius: 'var(--r-pill)',
            border: 'none',
            background: mode === key ? 'var(--accent-soft)' : 'transparent',
            color: mode === key ? 'var(--accent)' : 'var(--text-muted)',
            fontSize: 12, fontWeight: 500, cursor: 'pointer',
            fontFamily: 'var(--font-body)', position: 'relative',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          <Icon size={13} style={{ flexShrink: 0 }} />
          {label}
        </button>
      ))}

      <div style={{ width: 1, height: 16, background: 'var(--divider)', margin: '0 2px' }} />

      <button
        onClick={onVerify}
        disabled={isVerifying}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 10px',
          borderRadius: 'var(--r-pill)',
          border: 'none', background: 'transparent',
          color: 'var(--text-muted)',
          fontSize: 12, fontWeight: 500, cursor: isVerifying ? 'wait' : 'pointer',
          fontFamily: 'var(--font-body)', position: 'relative',
          whiteSpace: 'nowrap', flexShrink: 0,
        }}
        onMouseEnter={e => { if (!isVerifying) (e.currentTarget as HTMLElement).style.color = 'var(--text)' }}
        onMouseLeave={e => { if (!isVerifying) (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}
      >
        {isVerifying ? <Loader2 size={13} className="animate-spin" style={{ flexShrink: 0 }} /> : <ShieldCheck size={13} style={{ flexShrink: 0 }} />}
        {isVerifying ? 'Verifying…' : 'Verify content'}
        {!isVerifying && flagCount !== null && flagCount > 0 && (
          <span style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minWidth: 15, height: 15, padding: '0 3px', borderRadius: '50%',
            background: '#E8963C', color: 'white', fontSize: 9.5, fontWeight: 700,
          }}>
            {flagCount}
          </span>
        )}
      </button>

      <div style={{ width: 1, height: 16, background: 'var(--divider)', margin: '0 2px' }} />

      <button
        onClick={onOpenAskAI}
        {...{ [ASK_AI_TRIGGER_ATTR]: '' }}
        aria-describedby={showShortcut ? 'ask-ai-shortcut-desc' : undefined}
        title={showShortcut ? 'Ask AI — press ⌘ twice. Opens a floating chat over the deck; no panel is added.' : 'Ask AI'}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 10px',
          borderRadius: 'var(--r-pill)',
          border: 'none', background: 'transparent',
          color: 'var(--text-muted)',
          fontSize: 12, fontWeight: 500, cursor: 'pointer',
          fontFamily: 'var(--font-body)',
          whiteSpace: 'nowrap', flexShrink: 0,
        }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text)')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
      >
        <Sparkles size={13} style={{ flexShrink: 0 }} />
        Ask AI
        {/* Visible shortcut hint — previously only in the hover title
            tooltip, which most people never see, so the ⌘⌘ gesture had no
            on-screen discoverability at all. Apple platforms only. */}
        {showShortcut && (
        <kbd
          aria-hidden
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 10.5, fontWeight: 600, color: 'var(--text-disabled)',
            padding: '1px 5px', borderRadius: 'var(--r-xs)',
            border: '1px solid var(--border)', letterSpacing: '0.02em',
          }}
        >
          ⌘⌘
        </kbd>
        )}
      </button>
      {showShortcut && (
        <span id="ask-ai-shortcut-desc" style={srOnly}>
          Shortcut: press Command twice. Opens a floating chat over the deck without adding a panel.
        </span>
      )}

      <AnimatePresence>
      {showCoachmark && (
        // Non-blocking first-use tip: not a dialog, no focus steal, no
        // backdrop. Dismissed by ×, Escape, or simply using Ask AI once —
        // then it fades away.
        <motion.div
          key="coachmark"
          role="note"
          data-testid="ask-ai-coachmark"
          initial={{ opacity: 0, y: m.reduce ? 0 : -2 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, transition: m.exit }}
          transition={m.overlay}
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 8px 7px 12px', borderRadius: 'var(--r-md)',
            background: 'var(--surface-solid)', border: '1px solid var(--border)',
            boxShadow: 'var(--sh-2)', whiteSpace: 'nowrap',
            fontSize: 12, color: 'var(--text)', fontFamily: 'var(--font-body)',
          }}
        >
          <span>Press <kbd style={{ fontFamily: 'inherit', fontWeight: 600 }}>⌘</kbd> twice to ask AI — it floats over your deck.</span>
          <button
            type="button"
            onClick={dismissHint}
            aria-label="Dismiss tip"
            style={{
              width: 20, height: 20, borderRadius: '50%', border: 'none',
              background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={12} aria-hidden />
          </button>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  )
}

const srOnly: React.CSSProperties = {
  position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
  overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0,
}
