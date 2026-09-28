'use client'

import { AlertCircle, Loader2, RotateCcw } from 'lucide-react'
import type { GenerationProgress } from '@/lib/useStudioSession'

const PHASE_LABEL: Record<GenerationProgress['phase'], string> = {
  structure: 'Building your slides',
  images: 'Preparing visuals',
  slides: 'Creating slide layouts',
  finalizing: 'Finalizing your deck',
}

interface GenerationProgressBarProps {
  progress: GenerationProgress | null
  failed: boolean
  onRetry: () => void
}

/**
 * Anchored, single-row status for the /approve slide-generation pipeline —
 * one fixed-height row for the whole run (never swapped for a different
 * layout mid-generation, never stacked into a multi-step list), so nothing
 * about its own shape jumps as the phase changes. Only its label, its bar's
 * fill, and an optional "N of M" caption update in place.
 *
 * The bar is determinate (a real fraction) only for the two phases that
 * have a genuinely countable unit of work — images rendered, slides
 * revealed — using exactly the same counts already visible elsewhere
 * (image chip, thumb rail). 'structure' and 'finalizing' are single atomic
 * backend calls with nothing to count, so they show an indeterminate sweep
 * instead of a fabricated percentage.
 */
export function GenerationProgressBar({ progress, failed, onRetry }: GenerationProgressBarProps) {
  if (!progress && !failed) return null

  const hasFraction = !failed && progress?.total != null && progress.total > 0
  const fraction = hasFraction ? Math.min(1, (progress!.current ?? 0) / progress!.total!) : 0

  return (
    <div
      style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 16px',
        borderBottom: '1px solid var(--divider)',
        background: 'var(--surface-panel, var(--surface))',
      }}
    >
      {failed ? (
        <AlertCircle size={14} aria-hidden style={{ color: 'var(--danger, #E8515A)', flexShrink: 0 }} />
      ) : (
        <Loader2 size={14} aria-hidden className="studio-spin" style={{ color: 'var(--accent)', flexShrink: 0 }} />
      )}

      <span
        style={{
          fontSize: 12.5, color: 'var(--text)', fontFamily: 'var(--font-body)', fontWeight: 500,
          flexShrink: 0, whiteSpace: 'nowrap',
        }}
      >
        {failed ? 'Generation stopped' : PHASE_LABEL[progress!.phase]}
      </span>

      {!failed && (
        <div
          role="progressbar"
          aria-label={PHASE_LABEL[progress!.phase]}
          aria-valuetext={hasFraction ? `${progress!.current} of ${progress!.total}` : 'In progress'}
          {...(hasFraction ? { 'aria-valuenow': progress!.current, 'aria-valuemin': 0, 'aria-valuemax': progress!.total } : {})}
          style={{
            flex: 1, height: 5, borderRadius: 999, background: 'var(--surface-muted)',
            overflow: 'hidden', position: 'relative', minWidth: 60,
          }}
        >
          {hasFraction ? (
            <div
              style={{
                height: '100%', borderRadius: 999, background: 'var(--accent)',
                width: `${fraction * 100}%`, transition: 'width 0.3s ease',
              }}
            />
          ) : (
            // No countable unit of work for this phase — an honest sweep,
            // not a percentage that would have to be invented.
            <div className="dk-skeleton" style={{ position: 'absolute', inset: 0 }} />
          )}
        </div>
      )}

      {!failed && hasFraction && (
        <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', flexShrink: 0, whiteSpace: 'nowrap' }}>
          {progress!.current} of {progress!.total}
        </span>
      )}

      {failed && (
        <>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', flex: 1 }}>
            Something went wrong while building your slides.
          </span>
          <button
            type="button"
            onClick={onRetry}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 'var(--r-pill)',
              border: '1px solid var(--border)', background: 'var(--surface-muted)',
              color: 'var(--text)', fontSize: 12, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0,
            }}
          >
            <RotateCcw size={12} aria-hidden /> Retry
          </button>
        </>
      )}
    </div>
  )
}
