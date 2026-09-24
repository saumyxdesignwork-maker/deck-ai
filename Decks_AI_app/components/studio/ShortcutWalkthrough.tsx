'use client'

import { X, Check } from 'lucide-react'

export type WalkthroughStep = 0 | 1

const STEPS: { title: string; body: string; keys: string[] }[] = [
  {
    title: 'Try the Ask AI shortcut',
    body: 'Press ⌘ twice to open a floating chat over your deck — no panel gets added.',
    keys: ['⌘', '⌘'],
  },
  {
    title: 'Try the manual edit shortcut',
    body: 'Hold ⌘ and press / to bring in the editing tools on the right.',
    keys: ['⌘', '/'],
  },
]

interface ShortcutWalkthroughProps {
  step: WalkthroughStep
  /** True for a moment right after the real shortcut was detected — shows a
   * success state before either advancing to the next step or dismissing. */
  completed: boolean
  onDismiss: () => void
}

/**
 * A real, hands-on walkthrough — not a scripted demo. It never opens the
 * Ask AI popup or the insert panel itself; it just names the shortcut and
 * waits, and only advances once the app's own real keyboard handlers report
 * the surface actually opened (chatState / insertCollapsed, read by the
 * caller). The user has to do it themselves for it to move on.
 */
export function ShortcutWalkthrough({ step, completed, onDismiss }: ShortcutWalkthroughProps) {
  const { title, body, keys } = STEPS[step]

  return (
    <div
      role="note"
      aria-live="polite"
      style={{
        position: 'absolute', top: 62, left: '50%', transform: 'translateX(-50%)',
        zIndex: 16, width: 320,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
        padding: '18px 20px 16px',
        borderRadius: 'var(--r-lg)',
        background: 'var(--surface-solid)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--sh-3)',
        textAlign: 'center',
      }}
    >
      <button
        onClick={onDismiss}
        aria-label="Skip walkthrough"
        style={{
          position: 'absolute', top: 8, right: 8,
          width: 22, height: 22, borderRadius: '50%', border: 'none',
          background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <X size={12} aria-hidden />
      </button>

      {/* Step dots — just two steps, so a simple pair reads fine without a
          heavier progress bar. */}
      <div style={{ display: 'flex', gap: 5 }}>
        {STEPS.map((_, i) => (
          <span
            key={i}
            style={{
              width: 5, height: 5, borderRadius: '50%',
              background: i === step ? 'var(--accent)' : 'var(--border)',
            }}
          />
        ))}
      </div>

      <div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-body)', marginBottom: 4 }}>
          {title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>
          {body}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {keys.map((k, i) => (
          <kbd
            key={i}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              minWidth: 34, height: 34, padding: '0 8px',
              borderRadius: 'var(--r-md)',
              background: completed ? 'var(--success-soft)' : 'var(--surface-muted)',
              border: `1.5px solid ${completed ? 'var(--success)' : 'var(--accent)'}`,
              color: completed ? 'var(--success)' : 'var(--text)',
              fontFamily: 'inherit', fontSize: 15, fontWeight: 600,
              // Reuses the same blink keyframe as the working-status dots
              // elsewhere — no new animation needed just to say "waiting".
              animation: completed ? 'none' : 'studio-blink 1.4s ease-in-out infinite',
            }}
          >
            {k}
          </kbd>
        ))}
      </div>

      <div style={{ fontSize: 11.5, color: completed ? 'var(--success)' : 'var(--text-disabled)', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 4 }}>
        {completed ? (
          <>
            <Check size={12} aria-hidden /> Got it!
          </>
        ) : (
          'waiting for you…'
        )}
      </div>
    </div>
  )
}
