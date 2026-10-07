'use client'

import { useRef } from 'react'
import { getTemplate } from '@/lib/deckTemplates'
import { ChaosSlide } from './ChaosSlide'
import { useGSAP, ScrollTrigger } from './motion/gsapSetup'
import { prefersReducedMotion } from './motion/useReducedMotion'

const meridian = getTemplate('meridian')

function ease(t: number) {
  return t * t * (3 - 2 * t)
}
function clamp(v: number, a: number, b: number) {
  return Math.min(b, Math.max(a, v))
}

/**
 * The signature beat: pinned via plain CSS `position: sticky` (not GSAP's
 * `pin`, which would fight the sticky layout) over a 280vh scroll track.
 * A single ScrollTrigger drives `--k` (1 = chaotic, 0 = clean) on the chaos
 * stage, crossfades the two headlines, and swaps the status clock — ported
 * directly from the reference's scroll-math, just computed by ScrollTrigger
 * instead of a manual bounding-rect listener.
 */
export function TheTurn() {
  const rootRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const chaosRef = useRef<HTMLDivElement>(null)
  const clockRef = useRef<HTMLSpanElement>(null)

  useGSAP(
    () => {
      const chaosEl = chaosRef.current
      const copyA = rootRef.current?.querySelector<HTMLElement>('[data-turn-a]')
      const copyB = rootRef.current?.querySelector<HTMLElement>('[data-turn-b]')
      if (!chaosEl || !copyA || !copyB) return

      if (prefersReducedMotion()) {
        chaosEl.style.setProperty('--k', '0')
        copyA.style.opacity = '0'
        copyB.style.opacity = '1'
        if (clockRef.current) {
          clockRef.current.textContent = 'Done in 3 min'
          clockRef.current.style.background = 'var(--accent)'
        }
        return
      }

      ScrollTrigger.create({
        trigger: rootRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: self => {
          const k = 1 - ease(clamp((self.progress - 0.1) / 0.5, 0, 1))
          chaosEl.style.setProperty('--k', k.toFixed(3))
          const chaotic = k > 0.5
          copyA.style.opacity = chaotic ? '1' : '0'
          copyB.style.opacity = chaotic ? '0' : '1'
          if (clockRef.current) {
            clockRef.current.textContent = chaotic ? 'Slide 1 of 30, still formatting' : 'Done in 3 min'
            clockRef.current.style.background = chaotic ? 'var(--surface-solid)' : 'var(--accent)'
          }
        },
      })
    },
    { scope: rootRef }
  )

  return (
    <section ref={rootRef} className="m-turn" id="turn" aria-label="Meet Deck AI">
      <div className="m-turn-pin">
        <div className="m-wrap" style={{ width: '100%' }}>
          <div className="m-turn-copy">
            <h2 data-turn-a style={{ textAlign: 'center' }}>
              What if the first draft was already good?
            </h2>
            <h2 data-turn-b style={{ textAlign: 'center', opacity: 0 }}>
              Deck AI builds the whole deck: structure, copy, design. You make the calls.
            </h2>
          </div>
        </div>
        <div className="m-wrap" style={{ width: '100%' }}>
          <div className="m-turn-stage" ref={stageRef}>
            <ChaosSlide template={meridian} ref={chaosRef} />
          </div>
        </div>
      </div>
    </section>
  )
}
