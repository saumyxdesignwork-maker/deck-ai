'use client'

import { motion, useReducedMotion } from 'motion/react'
import { AspectRatio, aspectRatioCss } from '@/lib/fixtures'
import { motionPresets } from '@/lib/motion'

/** A shimmering placeholder bar — purely decorative; the shell around it
 * carries the accessible label. */
function Bar({ width, height = 13, style }: { width: string | number; height?: number; style?: React.CSSProperties }) {
  return <div className="dk-skeleton" style={{ width, height, borderRadius: 6, flexShrink: 0, ...style }} />
}

/** role="status": announced once when it mounts (agent state changing from
 * "waiting on you" to "working"), not on every shimmer frame. */
function SkeletonShell({ label, maxWidth, children }: { label: string; maxWidth?: number; children: React.ReactNode }) {
  const m = motionPresets(useReducedMotion())
  return (
    <motion.div
      role="status"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={m.content}
      style={{ width: '100%', maxWidth, margin: maxWidth ? '0 auto' : undefined }}
    >
      <div aria-hidden style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {children}
      </div>
      <p style={{ marginTop: 18, textAlign: 'center', fontSize: 12.5, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
        {label}
      </p>
    </motion.div>
  )
}

/**
 * Shown while the storyline is being drafted (after the brief is understood
 * or clarify answered, before there's an outline to review) — the canvas
 * used to just say "Preparing…" with no structure. Echoes the outline
 * review cards' shape (title + bullet lines) so the handoff into the real
 * cards doesn't jump.
 */
export function StorylineSkeleton() {
  return (
    <SkeletonShell label="Drafting your storyline…" maxWidth={620}>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            border: '1px solid var(--border)', borderRadius: 'var(--r-lg)',
            background: 'var(--surface)', padding: '16px 18px',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}
        >
          <Bar width={i === 1 ? '46%' : '58%'} height={16} />
          <Bar width="92%" />
          <Bar width="82%" />
          {i !== 1 && <Bar width="55%" />}
        </div>
      ))}
    </SkeletonShell>
  )
}

/**
 * Shown once the storyline is approved and slides are being written/imaged,
 * before the first slide is revealed. Echoes CoverBlock's shape (bottom-left
 * title/subtitle over a solid block, same aspect ratio) so it hands off to
 * the real cover without a jump.
 */
export function DeckSkeleton({ aspectRatio }: { aspectRatio?: AspectRatio }) {
  return (
    <SkeletonShell label="Preparing your slides…" maxWidth={640}>
      <div
        style={{
          borderRadius: 'var(--r-xl)', background: 'var(--surface-muted)',
          aspectRatio: aspectRatioCss(aspectRatio), padding: '64px 56px',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 12,
          boxSizing: 'border-box',
        }}
      >
        <Bar width="70%" height={26} style={{ borderRadius: 8 }} />
        <Bar width="42%" height={15} />
      </div>
    </SkeletonShell>
  )
}
