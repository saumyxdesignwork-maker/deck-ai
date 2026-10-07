'use client'

import { forwardRef } from 'react'
import type { DeckTemplate } from '@/lib/deckTemplates'
import { resolveSlideVars } from '@/lib/deckTemplates/toCssVars'

/**
 * The "blank-slide chaos" mock used in Problem and The Turn — the same
 * content scattered at odd angles (`--k`=1, fully chaotic) that snaps flat
 * (`--k`=0) as the caller animates `--k` via GSAP. Built on Meridian's real
 * colors/type, same as the clean slide it turns into, so the "turn" reads as
 * one slide tidying itself up, not two different templates.
 */
export const ChaosSlide = forwardRef<HTMLDivElement, { template: DeckTemplate; withClock?: boolean; clockRef?: React.Ref<HTMLSpanElement> }>(
  function ChaosSlide({ template, withClock, clockRef }, ref) {
    const vars = resolveSlideVars(template)
    return (
      <div
        ref={ref}
        className="m-chaos-stage"
        style={{ ...vars, background: template.colors.bg, color: template.colors.text, borderRadius: template.surfaces.slideRadius, ['--k' as string]: 1 }}
      >
        <div className="m-cx m-cx-title" style={{ ['--x' as string]: 7, ['--y' as string]: 7, ['--w' as string]: 58, ['--dx' as string]: 3, ['--dy' as string]: 9, ['--rot' as string]: -3 }}>
          Subscribers doubled in six months
          {withClock && <span className="m-cx-caret" />}
        </div>
        <div className="m-cx m-slide-card" style={{ ['--x' as string]: 7, ['--y' as string]: 27, ['--w' as string]: 26, ['--dx' as string]: 12, ['--dy' as string]: -5, ['--rot' as string]: 6 }}>
          <b>12.4k</b>
          <span>active subscribers</span>
        </div>
        <div className="m-cx m-slide-card" style={{ ['--x' as string]: 36, ['--y' as string]: 27, ['--w' as string]: 26, ['--dx' as string]: -9, ['--dy' as string]: 8, ['--rot' as string]: -5 }}>
          <b>2.1x</b>
          <span>revenue vs last year</span>
        </div>
        <div
          className="m-cx m-cx-chart"
          style={{
            ['--x' as string]: 68, ['--y' as string]: 7, ['--w' as string]: 26, ['--h' as string]: 33,
            ['--dx' as string]: -14, ['--dy' as string]: 18, ['--rot' as string]: 4,
            background: template.colors.surfaceMuted,
          }}
        >
          {[30, 45, 60, 78, 100].map((h, i) => (
            <i key={i} style={{ height: `${h}%`, background: template.colors.accent }} />
          ))}
        </div>
        <div className="m-cx m-cx-body" style={{ ['--x' as string]: 7, ['--y' as string]: 46, ['--w' as string]: 56, ['--dx' as string]: 18, ['--dy' as string]: 6, ['--rot' as string]: -2 }}>
          Growth came from referrals and the annual plan.
        </div>
        {withClock && (
          <div className="m-cx m-cx-empty" style={{ ['--x' as string]: 7, ['--y' as string]: 53, ['--w' as string]: 30, ['--h' as string]: 6, ['--dx' as string]: -2, ['--dy' as string]: -6, ['--rot' as string]: 2 }}>
            Click to add subtitle
          </div>
        )}
        <div className="m-cx-clock">
          <span ref={clockRef}>00:00</span>
        </div>
      </div>
    )
  }
)
